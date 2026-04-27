from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import configuracoes

engine = create_engine(
    configuracoes.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,   # testa a conexão antes de usar — evita erros com conexões velhas
    pool_recycle=1800,    # recicla conexões a cada 30 min — previne timeout do servidor
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)