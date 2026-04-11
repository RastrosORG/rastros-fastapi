from datetime import datetime
from typing import List, Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException, UploadFile

from app.modelos.resposta import Resposta, ArquivoResposta
from app.modelos.grupo import Grupo, MembroGrupo
from app.modelos.dossie import Dossie
from app.servicos import cronometro_servico
from app.servicos.storage_servico import upload_arquivo

# Pontuação por categoria — espelho do frontend
PONTOS_CATEGORIA = {
    'familia': 10,
    'info_basicas': 15,
    'info_avancadas': 30,
    'dia_desaparecimento': 25,
    'atividades_pos': 35,
    'darkweb': 50,
    'localizacao': 60,
}


# ── Helpers internos ─────────────────────────────────────────────

def _opcoes_resposta():
    """Eager load de dossie (many-to-one) e arquivos (one-to-many).
    Evita lazy loading em _serializar_resposta em qualquer contexto."""
    return [
        joinedload(Resposta.dossie),
        selectinload(Resposta.arquivos),
    ]

def _carregar_resposta(resposta_id: int, db: Session) -> Resposta:
    """Busca resposta por PK com todas as relações carregadas."""
    r = (
        db.query(Resposta)
        .options(*_opcoes_resposta())
        .filter(Resposta.id == resposta_id)
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="Resposta não encontrada.")
    return r

def _get_grupo_do_usuario(usuario_id: int, db: Session) -> int:
    membro = db.query(MembroGrupo).filter(MembroGrupo.usuario_id == usuario_id).first()
    if not membro:
        raise HTTPException(status_code=403, detail="Você não pertence a nenhum grupo.")
    return int(membro.grupo_id)


def _verificar_cronometro(db: Session):
    """Bloqueia submissão se a operação não foi iniciada ou já encerrou."""
    from app.modelos.cronometro import Cronometro
    c = db.query(Cronometro).filter(Cronometro.id == 1).first()
    if not c or not c.iniciado_em:
        raise HTTPException(
            status_code=403,
            detail="A operação ainda não foi iniciada pelo avaliador."
        )
    restante = cronometro_servico.calcular_restante(c)
    # Encerrado: não está ativo e não tem tempo restante
    if not c.ativo and restante <= 0:
        raise HTTPException(
            status_code=403,
            detail="O tempo da operação foi encerrado. Não é possível enviar respostas."
        )


def _serializar_resposta(r: Resposta) -> dict:
    avaliacao = None
    if r.comentario_avaliacao:
        avaliacao = {
            "comentario": r.comentario_avaliacao,
            "categoria_original": r.categoria_original,
            "categoria_nova": r.categoria_nova,
            "pontos": r.pontos,
        }
    return {
        "id": r.id,
        "titulo": r.titulo,
        "descricao": r.descricao,
        "categoria": r.categoria,
        "link": r.link,
        "grupo_id": r.grupo_id,
        "dossie_id": r.dossie_id,
        "dossie_nome": r.dossie.nome if r.dossie else "",
        "status": r.status,
        "criado_em": r.criado_em,
        "arquivos": [
            {"id": a.id, "nome_arquivo": a.nome_arquivo, "url_s3": a.url_s3}
            for a in r.arquivos
        ],
        "avaliacao": avaliacao,
    }


# ── Operações públicas ───────────────────────────────────────────

def criar_resposta(
    dossie_id: int,
    titulo: str,
    descricao: str,
    categoria: str,
    link: Optional[str],
    arquivos: List[UploadFile],
    usuario_id: int,
    db: Session,
) -> dict:
    _verificar_cronometro(db)

    grupo_id = _get_grupo_do_usuario(usuario_id, db)

    dossie = db.query(Dossie).filter(Dossie.id == dossie_id, Dossie.ativo == True).first()
    if not dossie:
        raise HTTPException(status_code=404, detail="Dossiê não encontrado ou inativo.")

    resposta = Resposta(
        titulo=titulo,
        descricao=descricao,
        categoria=categoria,
        link=link or None,
        grupo_id=grupo_id,
        dossie_id=dossie_id,
        status="pendente",
    )
    db.add(resposta)
    db.flush()  # obtém o ID antes do commit

    for arquivo in arquivos:
        nome, url = upload_arquivo(arquivo, f"respostas/{resposta.id}")
        arq = ArquivoResposta(resposta_id=int(resposta.id), nome_arquivo=nome, url_s3=url)
        db.add(arq)

    db.commit()
    # Recarrega com eager load — db.refresh só recarrega escalares, não relações
    resposta = _carregar_resposta(int(resposta.id), db)
    return _serializar_resposta(resposta)


def listar_minhas_respostas(usuario_id: int, db: Session) -> List[dict]:
    grupo_id = _get_grupo_do_usuario(usuario_id, db)

    respostas = (
        db.query(Resposta)
        .options(*_opcoes_resposta())
        .filter(Resposta.grupo_id == grupo_id)
        .order_by(Resposta.dossie_id.asc(), Resposta.criado_em.asc())
        .all()
    )

    # Agrupa por dossiê preservando a ordem de aparição
    por_dossie: dict[int, dict] = {}
    for r in respostas:
        did = int(r.dossie_id)
        if did not in por_dossie:
            por_dossie[did] = {
                "dossie_id": did,
                "dossie_nome": r.dossie.nome if r.dossie else "",
                "respostas": [],
            }
        por_dossie[did]["respostas"].append(_serializar_resposta(r))

    return list(por_dossie.values())


def listar_respostas_grupo(grupo_id: int, avaliador_id: int, db: Session) -> List[dict]:
    grupo = db.query(Grupo).filter(
        Grupo.id == grupo_id,
        Grupo.avaliador_id == avaliador_id,
    ).first()
    if not grupo:
        raise HTTPException(
            status_code=403,
            detail="Grupo não encontrado ou você não é o avaliador desse grupo."
        )

    respostas = (
        db.query(Resposta)
        .options(*_opcoes_resposta())
        .filter(Resposta.grupo_id == grupo_id)
        .order_by(Resposta.criado_em.asc())
        .all()
    )
    return [_serializar_resposta(r) for r in respostas]


def listar_grupos_do_avaliador(avaliador_id: int, db: Session) -> List[dict]:
    grupos = db.query(Grupo).filter(Grupo.avaliador_id == avaliador_id).all()
    if not grupos:
        return []

    grupo_ids = [int(g.id) for g in grupos]

    # Uma única query GROUP BY com agregação condicional — substitui 2×N COUNTs
    contagens = (
        db.query(
            Resposta.grupo_id,
            func.count(Resposta.id).label("total"),
            func.count(
                case((Resposta.status == "pendente", Resposta.id))
            ).label("pendentes"),
        )
        .filter(Resposta.grupo_id.in_(grupo_ids))
        .group_by(Resposta.grupo_id)
        .all()
    )
    mapa = {int(c.grupo_id): c for c in contagens}  # type: ignore[union-attr]

    return [
        {
            "grupo_id": g.id,
            "grupo_nome": g.nome_custom or g.nome,
            "total": int(mapa[int(g.id)].total) if int(g.id) in mapa else 0,  # type: ignore[union-attr]
            "pendentes": int(mapa[int(g.id)].pendentes) if int(g.id) in mapa else 0,  # type: ignore[union-attr]
        }
        for g in grupos
    ]


def avaliar_resposta(
    resposta_id: int,
    tipo: str,
    comentario: str,
    categoria_nova: Optional[str],
    avaliador_id: int,
    db: Session,
) -> dict:
    r = db.query(Resposta).filter(Resposta.id == resposta_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resposta não encontrada.")

    grupo = db.query(Grupo).filter(
        Grupo.id == r.grupo_id,
        Grupo.avaliador_id == avaliador_id,
    ).first()
    if not grupo:
        raise HTTPException(
            status_code=403,
            detail="Você não é o avaliador do grupo dessa resposta."
        )

    if tipo == "rejeitada":
        pontos = 0
        r.categoria_original = None  # type: ignore[assignment]
        r.categoria_nova = None  # type: ignore[assignment]
    elif tipo == "aprovada_parcial" and categoria_nova:
        pontos = PONTOS_CATEGORIA.get(categoria_nova, 0)
        r.categoria_original = r.categoria  # type: ignore[assignment]
        r.categoria_nova = categoria_nova  # type: ignore[assignment]
    else:
        pontos = PONTOS_CATEGORIA.get(str(r.categoria), 0)
        r.categoria_original = None  # type: ignore[assignment]
        r.categoria_nova = None  # type: ignore[assignment]

    r.status = tipo  # type: ignore[assignment]
    r.comentario_avaliacao = comentario  # type: ignore[assignment]
    r.pontos = pontos  # type: ignore[assignment]
    r.avaliado_em = datetime.utcnow()  # type: ignore[assignment]

    db.commit()
    # Recarrega com eager load — db.refresh só recarrega escalares, não relações
    return _serializar_resposta(_carregar_resposta(resposta_id, db))
