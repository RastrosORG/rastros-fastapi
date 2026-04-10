import secrets
import string
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.modelos.usuario import Usuario
from app.modelos.grupo import Grupo, MembroGrupo
from app.core.seguranca import hash_senha
from app.schemas.grupo import GerarUsuariosOutput, UsuarioCredencial

# Controle de geração simultânea — em produção usar Redis
_lock_geracao: dict = {}

def listar_grupos(db: Session, avaliador_id: int | None = None) -> list[Grupo]:
    query = db.query(Grupo).options(
        joinedload(Grupo.membros).joinedload(MembroGrupo.usuario)
    )
    if avaliador_id:
        query = query.filter(Grupo.avaliador_id == avaliador_id)
    return query.order_by(Grupo.nome).all()

def buscar_grupo(grupo_id: int, db: Session) -> Grupo:
    grupo = db.query(Grupo).options(
        joinedload(Grupo.membros).joinedload(MembroGrupo.usuario)
    ).filter(Grupo.id == grupo_id).first()
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

    novo_grupo = buscar_grupo(novo_grupo_id, db)

    if len(novo_grupo.membros) >= 4:
        raise HTTPException(
            status_code=400,
            detail="Grupo destino já tem 4 membros"
        )

    membro.grupo_id = novo_grupo_id  # type: ignore
    db.commit()
    return buscar_grupo(novo_grupo_id, db)

def _gerar_senha() -> str:
    chars = string.ascii_lowercase.replace('l', '').replace('o', '') + string.digits[2:]
    return ''.join(secrets.choice(chars) for _ in range(8))

def _proximo_login(db: Session) -> str:
    ultimo = db.query(Usuario).filter(
        Usuario.is_avaliador == False
    ).order_by(Usuario.id.desc()).first()

    if not ultimo:
        return "user01"

    num = int(str(ultimo.login).replace("user", "")) + 1
    return f"user{str(num).zfill(2)}"

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

        for idx_grupo, tamanho in enumerate(tamanhos):
            av = avaliadores[idx_grupo % len(avaliadores)]
            num_grupo = db.query(Grupo).count() + len(grupos_criados) + 1

            grupo = Grupo(
                nome=f"Grupo {str(num_grupo).zfill(2)}",
                avaliador_id=int(av.id)  # type: ignore
            )
            db.add(grupo)
            db.flush()

            for _ in range(tamanho):
                login = _proximo_login(db)
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