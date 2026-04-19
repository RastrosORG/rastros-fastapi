from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(50), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    is_avaliador = Column(Boolean, default=False, nullable=False)
    email = Column(String(100), nullable=True)  # só avaliadores têm email
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    ativo = Column(Boolean, default=True, nullable=False)
    nome_custom = Column(String(100), nullable=True)
    nome_alterado = Column(Boolean, default=False, nullable=False)
    aceitou_termos = Column(Boolean, default=False, nullable=False)

    # Relacionamentos
    grupo = relationship("MembroGrupo", back_populates="usuario", uselist=False)
    avaliador_grupos = relationship("Grupo", back_populates="avaliador")