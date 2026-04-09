from sqlalchemy import Column, Integer, DateTime, Boolean
from datetime import datetime
from app.db.base import Base

class Cronometro(Base):
    __tablename__ = "cronometro"

    id = Column(Integer, primary_key=True, index=True)
    iniciado_em = Column(DateTime, nullable=True)
    duracao_segundos = Column(Integer, nullable=False, default=0)
    ativo = Column(Boolean, default=False, nullable=False)
    pausado_em = Column(DateTime, nullable=True)
    segundos_pausados = Column(Integer, default=0, nullable=False)