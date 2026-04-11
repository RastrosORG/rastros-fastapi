from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session, subqueryload
from fastapi import HTTPException
from app.modelos.dossie import Dossie, ArquivoDossie
from app.modelos.resposta import Resposta, ArquivoResposta
from app.modelos.log_exclusao import LogExclusaoDossie
from app.schemas.dossie import DossieCreate, DossieUpdate
from app.servicos import storage_servico

def listar_dossies(db: Session, apenas_ativos: bool = False) -> list[Dossie]:
    # subqueryload evita N+1 lazy load de arquivos durante serialização
    query = db.query(Dossie).options(subqueryload(Dossie.arquivos))
    if apenas_ativos:
        query = query.filter(Dossie.ativo == True)
    return query.order_by(Dossie.criado_em.desc()).all()

def buscar_dossie(dossie_id: int, db: Session) -> Dossie:
    # db.get usa o identity map da sessão — cache em memória para lookups por PK
    dossie = db.get(Dossie, dossie_id)
    if not dossie:
        raise HTTPException(status_code=404, detail="Dossiê não encontrado")
    return dossie

def contar_respostas_em_lote(dossie_ids: list[int], db: Session) -> dict[int, int]:
    """Uma única query GROUP BY para todos os dossiês — evita N+1."""
    if not dossie_ids:
        return {}
    rows = (
        db.query(Resposta.dossie_id, func.count(Resposta.id).label("total"))
        .filter(Resposta.dossie_id.in_(dossie_ids))
        .group_by(Resposta.dossie_id)
        .all()
    )
    return {r.dossie_id: r.total for r in rows}

def criar_dossie(dados: DossieCreate, db: Session) -> Dossie:
    dossie = Dossie(
        nome=dados.nome,
        descricao=dados.descricao,
        data_nascimento=dados.data_nascimento,
        data_desaparecimento=dados.data_desaparecimento,
        local=dados.local,
        coordenadas=dados.coordenadas,
    )
    db.add(dossie)
    db.commit()
    db.refresh(dossie)
    return dossie

def atualizar_dossie(dossie_id: int, dados: DossieUpdate, db: Session) -> Dossie:
    dossie = buscar_dossie(dossie_id, db)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(dossie, campo, valor)
    db.commit()
    db.refresh(dossie)
    return dossie

def arquivar_dossie(dossie_id: int, db: Session) -> Dossie:
    dossie = buscar_dossie(dossie_id, db)
    dossie.ativo = not bool(dossie.ativo)
    db.commit()
    db.refresh(dossie)
    return dossie

def adicionar_arquivo(
    dossie_id: int,
    nome_arquivo: str,
    url_s3: str,
    db: Session
) -> ArquivoDossie:
    buscar_dossie(dossie_id, db)
    arquivo = ArquivoDossie(
        dossie_id=dossie_id,
        nome_arquivo=nome_arquivo,
        url_s3=url_s3,
    )
    db.add(arquivo)
    db.commit()
    db.refresh(arquivo)
    return arquivo

def contar_respostas(dossie_id: int, db: Session) -> int:
    return db.query(func.count(Resposta.id)).filter(Resposta.dossie_id == dossie_id).scalar() or 0


def excluir_dossie_permanente(
    dossie_id: int,
    avaliador_login: str,
    motivo: str,
    db: Session,
) -> None:
    """
    Exclui permanentemente um dossiê arquivado.
    Ordem: registra log → deleta S3 em lote → deleta banco em cascata.
    Lança 404 se não encontrado, 409 se não estiver arquivado.
    """
    dossie = db.query(Dossie).filter(Dossie.id == dossie_id).first()
    if not dossie:
        raise HTTPException(status_code=404, detail="Dossiê não encontrado")
    if dossie.ativo:
        raise HTTPException(
            status_code=409,
            detail="Apenas dossiês arquivados podem ser excluídos permanentemente"
        )

    # Coleta todas as URLs S3 antes de deletar do banco
    urls_s3: list[str] = []
    if dossie.foto_url:
        urls_s3.append(str(dossie.foto_url))

    arquivos_dossie = db.query(ArquivoDossie).filter(ArquivoDossie.dossie_id == dossie_id).all()
    for a in arquivos_dossie:
        urls_s3.append(str(a.url_s3))

    # Busca só os IDs — não carrega objetos completos de resposta para memória
    resposta_ids = [
        r[0] for r in db.query(Resposta.id).filter(Resposta.dossie_id == dossie_id).all()
    ]
    if resposta_ids:
        arqs_resp = db.query(ArquivoResposta).filter(
            ArquivoResposta.resposta_id.in_(resposta_ids)
        ).all()
        for a in arqs_resp:
            urls_s3.append(str(a.url_s3))

    # Registra log antes de deletar
    log = LogExclusaoDossie(
        nome_dossie=str(dossie.nome),
        criado_em=dossie.criado_em,
        excluido_em=datetime.utcnow(),
        avaliador_nome=avaliador_login,
        motivo=motivo,
    )
    db.add(log)
    db.flush()  # garante o log antes de qualquer delete

    # Deleta do S3 em lote (falha silenciosa)
    storage_servico.deletar_arquivos_lote(urls_s3)

    # Deleta do banco em cascata: arquivos_resposta → respostas → arquivos_dossie → dossie
    if resposta_ids:
        db.query(ArquivoResposta).filter(
            ArquivoResposta.resposta_id.in_(resposta_ids)
        ).delete(synchronize_session=False)
        db.query(Resposta).filter(Resposta.dossie_id == dossie_id).delete(synchronize_session=False)

    db.query(ArquivoDossie).filter(ArquivoDossie.dossie_id == dossie_id).delete(synchronize_session=False)
    db.delete(dossie)
    db.commit()


def listar_log_exclusoes(db: Session) -> list[LogExclusaoDossie]:
    return (
        db.query(LogExclusaoDossie)
        .order_by(LogExclusaoDossie.excluido_em.desc())
        .all()
    )