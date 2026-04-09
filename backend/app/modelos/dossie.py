from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Dossie(Base):
    __tablename__ = "dossies"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    descricao = Column(Text, nullable=False)
    data_nascimento = Column(Date, nullable=True)
    data_desaparecimento = Column(Date, nullable=False)
    local = Column(String(200), nullable=False)
    coordenadas = Column(String(50), nullable=True)
    foto_url = Column(String(500), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    respostas = relationship("Resposta", back_populates="dossie")
    arquivos = relationship("ArquivoDossie", back_populates="dossie")


class ArquivoDossie(Base):
    __tablename__ = "arquivos_dossie"

    id = Column(Integer, primary_key=True, index=True)
    dossie_id = Column(Integer, ForeignKey("dossies.id"), nullable=False)
    nome_arquivo = Column(String(255), nullable=False)
    url_s3 = Column(String(500), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    dossie = relationship("Dossie", back_populates="arquivos")