from sqlalchemy import func
from sqlalchemy.orm import Session
from app.modelos.mensagem import Mensagem
from app.modelos.grupo import Grupo
from app.modelos.usuario import Usuario


def _serializar(m: Mensagem, nomes: dict) -> dict:
    if m.is_sistema:
        return {"id": m.id, "texto": m.texto, "autor": "sistema",
                "hora": m.criado_em.strftime("%H:%M"), "tipo": "sistema",
                "usuario_id": None}
    if m.is_avaliador:
        return {"id": m.id, "texto": m.texto, "autor": "Avaliador",
                "hora": m.criado_em.strftime("%H:%M"), "tipo": "avaliador",
                "usuario_id": None}
    autor = nomes.get(m.usuario_id, f"user{m.usuario_id}")
    return {"id": m.id, "texto": m.texto, "autor": autor,
            "hora": m.criado_em.strftime("%H:%M"), "tipo": "grupo",
            "usuario_id": m.usuario_id}


def historico(grupo_id: int, db: Session, limite: int = 50) -> list:
    msgs = (
        db.query(Mensagem)
        .filter(Mensagem.grupo_id == grupo_id)
        .order_by(Mensagem.criado_em.desc())
        .limit(limite)
        .all()[::-1]
    )

    # Nomes em batch — uma query só
    ids = {m.usuario_id for m in msgs
           if m.usuario_id and not m.is_sistema and not m.is_avaliador}
    nomes: dict = {}
    if ids:
        rows = (db.query(Usuario.id, Usuario.login, Usuario.nome_custom)
                .filter(Usuario.id.in_(ids)).all())
        nomes = {r.id: (r.nome_custom or r.login) for r in rows}

    return [_serializar(m, nomes) for m in msgs]


def salvar_mensagem(
    grupo_id: int,
    usuario_id: int | None,
    texto: str,
    is_avaliador: bool,
    is_sistema: bool,
    db: Session,
) -> dict:
    msg = Mensagem(
        grupo_id=grupo_id,
        usuario_id=usuario_id,
        texto=texto,
        is_avaliador=is_avaliador,
        is_sistema=is_sistema,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    # Retorna dict serializado pronto para broadcast
    nomes = {}
    if usuario_id and not is_avaliador and not is_sistema:
        u = db.query(Usuario.id, Usuario.login, Usuario.nome_custom).filter(Usuario.id == usuario_id).first()
        if u:
            nomes[u.id] = u.nome_custom or u.login
    return _serializar(msg, nomes)


def listar_grupos_avaliador(avaliador_id: int, db: Session) -> list:
    grupos = db.query(Grupo).filter(Grupo.avaliador_id == avaliador_id).all()
    if not grupos:
        return []

    grupo_ids = [g.id for g in grupos]

    # Subconsulta: última mensagem por grupo — 1 query para todos os grupos
    subq = (
        db.query(
            Mensagem.grupo_id,
            func.max(Mensagem.criado_em).label("ultima_data"),
        )
        .filter(Mensagem.grupo_id.in_(grupo_ids))
        .group_by(Mensagem.grupo_id)
        .subquery()
    )
    ultimas_rows = (
        db.query(Mensagem)
        .join(subq, (Mensagem.grupo_id == subq.c.grupo_id)
              & (Mensagem.criado_em == subq.c.ultima_data))
        .all()
    )
    ultimas: dict[int, Mensagem] = {m.grupo_id: m for m in ultimas_rows}

    resultado = []
    for g in grupos:
        ultima = ultimas.get(g.id)
        resultado.append({
            "id": g.id,
            "nome": g.nome_custom or g.nome,
            "chamou_avaliador": g.chamou_avaliador,
            "avaliador_presente": g.avaliador_presente,
            "ultima_mensagem": ultima.texto if ultima else "",
            "ultima_hora": ultima.criado_em.strftime("%H:%M") if ultima else "",
        })
    return resultado


def marcar_chamada(grupo_id: int, db: Session):
    g = db.get(Grupo, grupo_id)
    if g:
        g.chamou_avaliador = True  # type: ignore[assignment]
        db.commit()


def entrar_chat(grupo_id: int, db: Session):
    g = db.get(Grupo, grupo_id)
    if g:
        g.chamou_avaliador = False      # type: ignore[assignment]
        g.avaliador_presente = True     # type: ignore[assignment]
        db.commit()


def sair_chat(grupo_id: int, db: Session):
    g = db.get(Grupo, grupo_id)
    if g:
        g.avaliador_presente = False    # type: ignore[assignment]
        db.commit()
