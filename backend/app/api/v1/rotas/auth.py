from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_usuario_atual
from app.core.config import configuracoes
from app.schemas.auth import LoginInput, TokenOutput, UsuarioOutput, CadastroAvaliadorInput
from app.servicos import auth_servico

router = APIRouter()

@router.post("/login", response_model=TokenOutput)
def login(dados: LoginInput, db: Session = Depends(get_db)):
    return auth_servico.login(dados, db)

@router.post("/cadastro-avaliador", status_code=201)
def cadastro_avaliador(dados: CadastroAvaliadorInput, db: Session = Depends(get_db)):
    if dados.chave_acesso.strip() != configuracoes.CHAVE_CADASTRO_AVALIADOR.strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chave de acesso inválida."
        )
    auth_servico.criar_usuario(
        login=dados.login,
        senha=dados.senha,
        is_avaliador=True,
        email=dados.email,
        db=db,
    )

@router.get("/me", response_model=UsuarioOutput)
def me(usuario_atual = Depends(get_usuario_atual)):
    return usuario_atual