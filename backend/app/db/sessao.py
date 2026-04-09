from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import configuracoes

engine = create_engine(configuracoes.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)