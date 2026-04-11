from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.base import Base


class LogExclusaoDossie(Base):
    __tablename__ = "log_exclusao_dossie"

    id = Column(Integer, primary_key=True, index=True)
    nome_dossie = Column(String(150), nullable=False)
    criado_em = Column(DateTime, nullable=False)           # data de criação do dossiê
    excluido_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    avaliador_nome = Column(String(100), nullable=False)   # login do avaliador
    motivo = Column(String(100), nullable=False)
