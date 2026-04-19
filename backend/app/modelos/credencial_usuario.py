from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.db.base import Base


class CredencialUsuario(Base):
    __tablename__ = "credenciais_usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), unique=True, nullable=False)
    login = Column(String(50), nullable=False)
    senha = Column(String(100), nullable=False)
    grupo_id = Column(Integer, nullable=False)
    grupo_nome = Column(String(100), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow, nullable=False)
