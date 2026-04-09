from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from app.core.config import configuracoes

def hash_senha(senha: str) -> str:
    senha_bytes = senha.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha_bytes, salt).decode('utf-8')

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    return bcrypt.checkpw(
        senha_plana.encode('utf-8'),
        senha_hash.encode('utf-8')
    )

def criar_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=configuracoes.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, configuracoes.SECRET_KEY, algorithm=configuracoes.ALGORITHM)

def verificar_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, configuracoes.SECRET_KEY, algorithms=[configuracoes.ALGORITHM])
        return payload
    except JWTError:
        return None