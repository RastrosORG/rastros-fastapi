import secrets
import string
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.modelos.usuario import Usuario
from app.modelos.grupo import Grupo, MembroGrupo
from app.modelos.resposta import Resposta, ArquivoResposta
from app.modelos.log_exclusao_usuario import LogExclusaoUsuario
from app.modelos.credencial_usuario import CredencialUsuario
from app.core.seguranca import hash_senha
from app.schemas.grupo import GerarUsuariosOutput, UsuarioCredencial, AdicionarMembroOutput, GrupoOutput, AtualizarNomeGrupoInput, ListarCredenciaisOutput, CredencialOutput, MovimentoMembro
from app.servicos import storage_servico

# Controle de geração simultânea — em produção usar Redis
_lock_geracao: dict = {}

# Lock de edição de grupos compartilhado entre avaliadores
_lock_edicao: dict = {}


def adquirir_lock_edicao(avaliador_id: int, avaliador_nome: str) -> None:
    global _lock_edicao
    agora = datetime.utcnow()
    if _lock_edicao.get("ativo") and _lock_edicao.get("expira", agora) > agora:
        if _lock_edicao.get("avaliador_id") != avaliador_id:
            raise HTTPException(
                status_code=409,
                detail={
                    "avaliador_id": _lock_edicao["avaliador_id"],
                    "avaliador_nome": _lock_edicao["avaliador_nome"],
                }
            )
    _lock_edicao = {
        "ativo": True,
        "avaliador_id": avaliador_id,
        "avaliador_nome": avaliador_nome,
        "expira": agora + timedelta(minutes=30),
    }


def liberar_lock_edicao(avaliador_id: int) -> None:
    global _lock_edicao
    if _lock_edicao.get("avaliador_id") == avaliador_id:
        _lock_edicao = {}


def status_lock_edicao() -> dict | None:
    agora = datetime.utcnow()
    if _lock_edicao.get("ativo") and _lock_edicao.get("expira", agora) > agora:
        return {
            "avaliador_id": _lock_edicao["avaliador_id"],
            "avaliador_nome": _lock_edicao["avaliador_nome"],
        }
    return None

def _opcoes_grupo():
    """Eager load de membros→usuário e avaliador — evita N+1 em toda listagem."""
    return [
        joinedload(Grupo.membros).joinedload(MembroGrupo.usuario),
        joinedload(Grupo.avaliador),
    ]

def listar_grupos(db: Session, avaliador_id: int | None = None) -> list[Grupo]:
    query = db.query(Grupo).options(*_opcoes_grupo())
    if avaliador_id:
        query = query.filter(Grupo.avaliador_id == avaliador_id)
    return query.order_by(Grupo.nome).all()

def buscar_grupo(grupo_id: int, db: Session) -> Grupo:
    grupo = db.query(Grupo).options(*_opcoes_grupo()).filter(Grupo.id == grupo_id).first()
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return grupo

def transferir_grupo(grupo_id: int, novo_avaliador_id: int, db: Session) -> Grupo:
    grupo = buscar_grupo(grupo_id, db)
    avaliador = db.query(Usuario).filter(
        Usuario.id == novo_avaliador_id,
        Usuario.is_avaliador == True
    ).first()
    if not avaliador:
        raise HTTPException(status_code=404, detail="Avaliador não encontrado")
    grupo.avaliador_id = novo_avaliador_id  # type: ignore
    db.commit()
    db.refresh(grupo)
    return grupo

def mover_membro(usuario_id: int, novo_grupo_id: int, db: Session) -> Grupo:
    membro = db.query(MembroGrupo).filter(
        MembroGrupo.usuario_id == usuario_id
    ).first()
    if not membro:
        raise HTTPException(status_code=404, detail="Membro não encontrado")

    # COUNT leve em vez de carregar o grupo inteiro só para checar tamanho
    count_destino = (
        db.query(func.count(MembroGrupo.id))
        .filter(MembroGrupo.grupo_id == novo_grupo_id)
        .scalar() or 0
    )
    if count_destino >= 4:
        raise HTTPException(status_code=400, detail="Grupo destino já tem 4 membros")

    membro.grupo_id = novo_grupo_id  # type: ignore

    # Atualiza grupo na tabela de credenciais
    credencial = db.query(CredencialUsuario).filter(
        CredencialUsuario.usuario_id == usuario_id
    ).first()
    if credencial:
        novo_grupo = db.get(Grupo, novo_grupo_id)
        credencial.grupo_id = novo_grupo_id  # type: ignore
        if novo_grupo:
            credencial.grupo_nome = str(novo_grupo.nome_custom or novo_grupo.nome)  # type: ignore

    db.commit()
    # Uma única busca com eager load ao final
    return buscar_grupo(novo_grupo_id, db)

def _gerar_senha() -> str:
    chars = string.ascii_lowercase.replace('l', '').replace('o', '') + string.digits[2:]
    return ''.join(secrets.choice(chars) for _ in range(8))

def _numero_inicial_login(db: Session) -> int:
    """Retorna o próximo número de login disponível — uma única query."""
    ultimo = db.query(Usuario).filter(
        Usuario.is_avaliador == False
    ).order_by(Usuario.id.desc()).first()
    if not ultimo:
        return 1
    return int(str(ultimo.login).replace("user", "")) + 1

def gerar_usuarios(
    quantidade: int,
    avaliador_solicitante_id: int,
    db: Session
) -> GerarUsuariosOutput:
    if quantidade < 4:
        raise HTTPException(status_code=400, detail="Mínimo de 4 usuários")

    global _lock_geracao
    agora = datetime.utcnow()
    if _lock_geracao.get("ativo") and _lock_geracao.get("expira", agora) > agora:
        raise HTTPException(
            status_code=409,
            detail="Outro avaliador já está gerando usuários. Aguarde."
        )

    ultimo_usuario = db.query(Usuario).filter(
        Usuario.is_avaliador == False
    ).order_by(Usuario.criado_em.desc()).first()

    if ultimo_usuario:
        diff = agora - ultimo_usuario.criado_em
        if diff < timedelta(hours=24):
            horas_restantes = 24 - diff.total_seconds() / 3600
            raise HTTPException(
                status_code=400,
                detail=f"Usuários já foram gerados. Aguarde {horas_restantes:.1f}h."
            )

    _lock_geracao = {
        "ativo": True,
        "avaliador_id": avaliador_solicitante_id,
        "expira": agora + timedelta(minutes=2)
    }

    try:
        avaliadores = db.query(Usuario).filter(
            Usuario.is_avaliador == True,
            Usuario.ativo == True
        ).all()

        if not avaliadores:
            raise HTTPException(status_code=400, detail="Nenhum avaliador cadastrado")

        total = quantidade
        qtd4, qtd3 = 0, 0
        if total % 4 == 0:
            qtd4 = total // 4
        elif total % 4 == 1:
            qtd4 = total // 4 - 1
            qtd3 = 3
        elif total % 4 == 2:
            qtd4 = total // 4
            qtd3 = 2
        elif total % 4 == 3:
            qtd4 = total // 4
            qtd3 = 1

        tamanhos = [4] * qtd4 + [3] * qtd3
        credenciais: list[UsuarioCredencial] = []
        grupos_criados: list[Grupo] = []

        # Contagem inicial fora do loop — evita N COUNTs ao banco
        num_grupos_base = db.query(func.count(Grupo.id)).scalar() or 0
        # Número inicial do próximo login — evita N queries em _numero_inicial_login
        proximo_num_login = _numero_inicial_login(db)

        for idx_grupo, tamanho in enumerate(tamanhos):
            av = avaliadores[idx_grupo % len(avaliadores)]
            num_grupo = num_grupos_base + len(grupos_criados) + 1

            grupo = Grupo(
                nome=f"Grupo {str(num_grupo).zfill(2)}",
                avaliador_id=int(av.id)  # type: ignore
            )
            db.add(grupo)
            db.flush()

            for _ in range(tamanho):
                login = f"user{str(proximo_num_login).zfill(2)}"
                proximo_num_login += 1
                senha = _gerar_senha()

                usuario = Usuario(
                    login=login,
                    senha_hash=hash_senha(senha),
                    is_avaliador=False,
                )
                db.add(usuario)
                db.flush()

                membro = MembroGrupo(
                    usuario_id=int(usuario.id),  # type: ignore
                    grupo_id=int(grupo.id)  # type: ignore
                )
                db.add(membro)

                credencial_row = CredencialUsuario(
                    usuario_id=int(usuario.id),  # type: ignore
                    login=login,
                    senha=senha,
                    grupo_id=int(grupo.id),  # type: ignore
                    grupo_nome=str(grupo.nome),
                )
                db.add(credencial_row)

                credenciais.append(UsuarioCredencial(
                    id=int(usuario.id),  # type: ignore
                    login=str(usuario.login),
                    senha=senha,
                    grupo_id=int(grupo.id),  # type: ignore
                    grupo_nome=str(grupo.nome)
                ))

            grupos_criados.append(grupo)

        db.commit()

        return GerarUsuariosOutput(
            grupos_criados=len(grupos_criados),
            usuarios_criados=quantidade,
            credenciais=credenciais
        )

    finally:
        _lock_geracao = {}

def meu_grupo(usuario_id: int, db: Session) -> Grupo:
    membro = db.query(MembroGrupo).filter(
        MembroGrupo.usuario_id == usuario_id
    ).first()
    if not membro:
        raise HTTPException(status_code=404, detail="Você não pertence a nenhum grupo")
    return buscar_grupo(int(membro.grupo_id), db)  # type: ignore

def atualizar_nome_grupo(grupo_id: int, nome_custom: str, usuario_id: int, db: Session) -> Grupo:
    membro = db.query(MembroGrupo).filter(
        MembroGrupo.usuario_id == usuario_id,
        MembroGrupo.grupo_id == grupo_id
    ).first()
    if not membro:
        raise HTTPException(status_code=403, detail="Você não pertence a este grupo")

    grupo = buscar_grupo(grupo_id, db)
    if grupo.nome_alterado:
        raise HTTPException(status_code=400, detail="O nome do grupo já foi alterado e não pode ser mudado novamente")

    nome = nome_custom.strip()
    if len(nome) < 3:
        raise HTTPException(status_code=400, detail="Nome muito curto")

    grupo.nome_custom = nome  # type: ignore
    grupo.nome_alterado = True  # type: ignore
    db.commit()
    db.refresh(grupo)
    return grupo

def adicionar_membro(db: Session) -> AdicionarMembroOutput:
    todos_grupos = db.query(Grupo).options(
        joinedload(Grupo.membros)
    ).all()

    if not todos_grupos:
        raise HTTPException(status_code=400, detail="Nenhum grupo existe ainda")

    grupo_destino = next((g for g in todos_grupos if len(g.membros) == 3), None)

    if grupo_destino is None:
        grupos_4 = [g for g in todos_grupos if len(g.membros) == 4]
        if len(grupos_4) < 2:
            raise HTTPException(
                status_code=400,
                detail="Grupos insuficientes para redistribuir"
            )

        avaliadores = db.query(Usuario).filter(
            Usuario.is_avaliador == True,
            Usuario.ativo == True
        ).all()
        if not avaliadores:
            raise HTTPException(status_code=400, detail="Nenhum avaliador disponível")

        total_grupos = len(todos_grupos)
        av = avaliadores[total_grupos % len(avaliadores)]

        grupo_destino = Grupo(
            nome=f"Grupo {str(total_grupos + 1).zfill(2)}",
            avaliador_id=int(av.id)  # type: ignore
        )
        db.add(grupo_destino)
        db.flush()

        ids_movidos: list[int] = []
        for g in grupos_4[:2]:
            membro_mover = g.membros[-1]
            ids_movidos.append(int(membro_mover.usuario_id))  # type: ignore
            membro_mover.grupo_id = int(grupo_destino.id)  # type: ignore
            # Atualiza credencial do membro movido para o novo grupo
            cred_mover = db.query(CredencialUsuario).filter(
                CredencialUsuario.usuario_id == int(membro_mover.usuario_id)  # type: ignore
            ).first()
            if cred_mover:
                cred_mover.grupo_id = int(grupo_destino.id)  # type: ignore
                cred_mover.grupo_nome = str(grupo_destino.nome)  # type: ignore
    else:
        ids_movidos = []

    login = f"user{str(_numero_inicial_login(db)).zfill(2)}"
    senha = _gerar_senha()

    novo_usuario = Usuario(
        login=login,
        senha_hash=hash_senha(senha),
        is_avaliador=False,
    )
    db.add(novo_usuario)
    db.flush()

    membro = MembroGrupo(
        usuario_id=int(novo_usuario.id),  # type: ignore
        grupo_id=int(grupo_destino.id)  # type: ignore
    )
    db.add(membro)

    credencial_row = CredencialUsuario(
        usuario_id=int(novo_usuario.id),  # type: ignore
        login=login,
        senha=senha,
        grupo_id=int(grupo_destino.id),  # type: ignore
        grupo_nome=str(grupo_destino.nome),
    )
    db.add(credencial_row)
    db.commit()

    return AdicionarMembroOutput(
        credencial=UsuarioCredencial(
            id=int(novo_usuario.id),  # type: ignore
            login=login,
            senha=senha,
            grupo_id=int(grupo_destino.id),  # type: ignore
            grupo_nome=str(grupo_destino.nome)
        ),
        membros_movidos=ids_movidos,
    )


def excluir_usuario_permanente(
    usuario_id: int,
    motivo: str,
    avaliador_nome: str,
    db: Session,
) -> None:
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if usuario.is_avaliador:
        raise HTTPException(status_code=400, detail="Não é possível excluir avaliadores por esta rota")

    # Busca o grupo para registrar no log
    membro = db.query(MembroGrupo).filter(MembroGrupo.usuario_id == usuario_id).first()
    grupo_nome = ""
    if membro:
        grupo = db.get(Grupo, membro.grupo_id)
        if grupo:
            grupo_nome = str(grupo.nome_custom or grupo.nome)

    # Registra no log antes de deletar
    log = LogExclusaoUsuario(
        tipo='usuario',
        nome_usuario=str(usuario.login),
        grupo_nome=grupo_nome,
        avaliador_nome=avaliador_nome,
        motivo=motivo,
    )
    db.add(log)
    db.flush()

    # Remove a credencial da tabela de credenciais
    credencial = db.query(CredencialUsuario).filter(
        CredencialUsuario.usuario_id == usuario_id
    ).first()
    if credencial:
        db.delete(credencial)

    # Remove o membro do grupo
    if membro:
        db.delete(membro)

    # Deleta o usuário
    db.delete(usuario)
    db.commit()


def excluir_grupo_permanente(
    grupo_id: int,
    motivo: str,
    avaliador_nome: str,
    db: Session,
) -> None:
    grupo = buscar_grupo(grupo_id, db)

    # Coleta IDs das respostas do grupo para buscar arquivos S3
    resposta_ids = [
        r[0] for r in db.query(Resposta.id).filter(Resposta.grupo_id == grupo_id).all()
    ]

    # Coleta URLs S3 antes de deletar
    urls_s3: list[str] = []
    if resposta_ids:
        urls_s3 = [
            r[0] for r in
            db.query(ArquivoResposta.url_s3)
            .filter(ArquivoResposta.resposta_id.in_(resposta_ids))
            .all()
        ]

    # Registra no log: um por membro + um pelo grupo
    for membro in grupo.membros:
        db.add(LogExclusaoUsuario(
            tipo='usuario',
            nome_usuario=str(membro.usuario.login),
            grupo_nome=str(grupo.nome_custom or grupo.nome),
            avaliador_nome=avaliador_nome,
            motivo=motivo,
        ))
    db.add(LogExclusaoUsuario(
        tipo='grupo',
        nome_usuario=str(grupo.nome_custom or grupo.nome),
        grupo_nome=str(grupo.nome_custom or grupo.nome),
        avaliador_nome=avaliador_nome,
        motivo=motivo,
    ))
    db.flush()

    # Deleta arquivos S3 em lote (falha silenciosa)
    storage_servico.deletar_arquivos_lote(urls_s3)

    # Deleta registros do banco em cascata
    if resposta_ids:
        db.query(ArquivoResposta).filter(
            ArquivoResposta.resposta_id.in_(resposta_ids)
        ).delete(synchronize_session=False)
        db.query(Resposta).filter(
            Resposta.grupo_id == grupo_id
        ).delete(synchronize_session=False)

    db.query(MembroGrupo).filter(
        MembroGrupo.grupo_id == grupo_id
    ).delete(synchronize_session=False)

    db.delete(grupo)
    db.commit()


def reorganizar_membros(movimentos: list[MovimentoMembro], db: Session) -> None:
    for mov in movimentos:
        membro = db.query(MembroGrupo).filter(
            MembroGrupo.usuario_id == mov.usuario_id
        ).first()
        if not membro:
            raise HTTPException(status_code=404, detail=f"Membro {mov.usuario_id} não encontrado")

        membro.grupo_id = mov.grupo_id  # type: ignore

        # Atualiza grupo na tabela de credenciais
        credencial = db.query(CredencialUsuario).filter(
            CredencialUsuario.usuario_id == mov.usuario_id
        ).first()
        if credencial:
            grupo = db.get(Grupo, mov.grupo_id)
            credencial.grupo_id = mov.grupo_id  # type: ignore
            if grupo:
                credencial.grupo_nome = str(grupo.nome_custom or grupo.nome)  # type: ignore

    # Garante que todas as mudanças de FK estejam persistidas na sessão antes de validar
    db.flush()

    # Valida estado final com contagem direta — evita usar coleções ORM que podem estar
    # desatualizadas na identity map quando o grupo_id foi alterado via FK direto
    contagens = (
        db.query(MembroGrupo.grupo_id, func.count(MembroGrupo.id).label('n'))
        .group_by(MembroGrupo.grupo_id)
        .all()
    )
    for grupo_id_val, n in contagens:
        if n > 0 and (n < 3 or n > 4):
            db.rollback()
            grupo = db.get(Grupo, grupo_id_val)
            nome = str(grupo.nome_custom or grupo.nome) if grupo else str(grupo_id_val)
            raise HTTPException(
                status_code=400,
                detail=f"Grupo '{nome}' ficaria com {n} membros"
            )

    db.commit()


def listar_credenciais(db: Session) -> ListarCredenciaisOutput:
    rows = (
        db.query(CredencialUsuario)
        .order_by(CredencialUsuario.grupo_id, CredencialUsuario.login)
        .all()
    )
    ultima: datetime | None = max((r.criado_em for r in rows), default=None) if rows else None  # type: ignore[type-var, assignment]
    return ListarCredenciaisOutput(
        credenciais=[
            CredencialOutput(
                id=int(r.usuario_id),  # type: ignore
                login=str(r.login),
                senha=str(r.senha),
                grupo_id=int(r.grupo_id),  # type: ignore
                grupo_nome=str(r.grupo_nome),
            )
            for r in rows
        ],
        ultima_atualizacao=ultima,
    )


def listar_log_exclusoes_usuarios(db: Session) -> list[LogExclusaoUsuario]:
    return (
        db.query(LogExclusaoUsuario)
        .order_by(LogExclusaoUsuario.excluido_em.desc())
        .all()
    )