from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.base import Base


class LogExclusaoUsuario(Base):
    __tablename__ = "log_exclusao_usuario"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(10), nullable=False)          # 'usuario' ou 'grupo'
    nome_usuario = Column(String(100), nullable=False)  # login do usuário ou nome do grupo
    grupo_nome = Column(String(100), nullable=False)
    excluido_em = Column(DateTime, default=datetime.utcnow, nullable=False)
    avaliador_nome = Column(String(100), nullable=False)
    motivo = Column(String(100), nullable=False)
