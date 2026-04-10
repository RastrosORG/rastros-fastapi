from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modelos.dossie import Dossie, ArquivoDossie
from app.modelos.resposta import Resposta
from app.schemas.dossie import DossieCreate, DossieUpdate

def listar_dossies(db: Session, apenas_ativos: bool = False) -> list[Dossie]:
    query = db.query(Dossie)
    if apenas_ativos:
        query = query.filter(Dossie.ativo == True)
    return query.order_by(Dossie.criado_em.desc()).all()

def buscar_dossie(dossie_id: int, db: Session) -> Dossie:
    dossie = db.query(Dossie).filter(Dossie.id == dossie_id).first()
    if not dossie:
        raise HTTPException(status_code=404, detail="Dossiê não encontrado")
    return dossie

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
    return db.query(Resposta).filter(Resposta.dossie_id == dossie_id).count()