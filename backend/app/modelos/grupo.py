from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Grupo(Base):
    __tablename__ = "grupos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(50), nullable=False)
    nome_custom = Column(String(100), nullable=True)
    nome_alterado = Column(Boolean, default=False, nullable=False)
    chamou_avaliador = Column(Boolean, default=False, nullable=False, server_default='false')
    avaliador_presente = Column(Boolean, default=False, nullable=False, server_default='false')
    avaliador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relacionamentos
    avaliador = relationship("Usuario", back_populates="avaliador_grupos")
    membros = relationship("MembroGrupo", back_populates="grupo")
    respostas = relationship("Resposta", back_populates="grupo")
    mensagens = relationship("Mensagem", back_populates="grupo")


class MembroGrupo(Base):
    __tablename__ = "membros_grupo"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    grupo_id = Column(Integer, ForeignKey("grupos.id"), nullable=False)

    # Relacionamentos
    usuario = relationship("Usuario", back_populates="grupo")
    grupo = relationship("Grupo", back_populates="membros")