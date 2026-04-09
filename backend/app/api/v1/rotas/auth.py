from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_usuario_atual
from app.schemas.auth import LoginInput, TokenOutput, UsuarioOutput
from app.servicos import auth_servico

router = APIRouter()

@router.post("/login", response_model=TokenOutput)
def login(dados: LoginInput, db: Session = Depends(get_db)):
    return auth_servico.login(dados, db)

@router.get("/me", response_model=UsuarioOutput)
def me(usuario_atual = Depends(get_usuario_atual)):
    return usuario_atual