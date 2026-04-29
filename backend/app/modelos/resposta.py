from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base

class StatusResposta(enum.Enum):
    pendente = "pendente"
    aprovada = "aprovada"
    aprovada_parcial = "aprovada_parcial"
    rejeitada = "rejeitada"

class Resposta(Base):
    __tablename__ = "respostas"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=False)
    categoria = Column(String(50), nullable=False)
    link = Column(String(500), nullable=True)
    grupo_id = Column(Integer, ForeignKey("grupos.id"), nullable=False)
    dossie_id = Column(Integer, ForeignKey("dossies.id"), nullable=False)
    status = Column(String(20), default="pendente", nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    favorito = Column(Boolean, default=False, nullable=False)

    # Avaliação
    comentario_avaliacao = Column(Text, nullable=True)
    categoria_original = Column(String(50), nullable=True)
    categoria_nova = Column(String(50), nullable=True)
    pontos = Column(Integer, default=0, nullable=False)
    avaliado_em = Column(DateTime, nullable=True)

    # Relacionamentos
    grupo = relationship("Grupo", back_populates="respostas")
    dossie = relationship("Dossie", back_populates="respostas")
    arquivos = relationship("ArquivoResposta", back_populates="resposta")


class ArquivoResposta(Base):
    __tablename__ = "arquivos_resposta"

    id = Column(Integer, primary_key=True, index=True)
    resposta_id = Column(Integer, ForeignKey("respostas.id"), nullable=False)
    nome_arquivo = Column(String(255), nullable=False)
    url_s3 = Column(String(500), nullable=False)

    # Relacionamentos
    resposta = relationship("Resposta", back_populates="arquivos")