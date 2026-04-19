from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.modelos.usuario import Usuario
from app.core.seguranca import verificar_senha, criar_token, hash_senha
from app.schemas.auth import LoginInput, TokenOutput

def login(dados: LoginInput, db: Session) -> TokenOutput:
    usuario = db.query(Usuario).filter(
        Usuario.login == dados.login,
        Usuario.ativo == True
    ).first()

    if not usuario or not verificar_senha(str(dados.senha), str(usuario.senha_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha incorretos"
        )

    token = criar_token({"sub": str(usuario.id)})

    return TokenOutput(
        access_token=token,
        is_avaliador=bool(usuario.is_avaliador),
        usuario_id=int(usuario.id),
        login=str(usuario.login),
        aceitou_termos=bool(usuario.aceitou_termos),
    )

def aceitar_termos(usuario_id: int, db: Session) -> None:
    usuario = db.get(Usuario, usuario_id)
    if usuario:
        usuario.aceitou_termos = True  # type: ignore[assignment]
        db.commit()


def criar_usuario(
    login: str,
    senha: str,
    is_avaliador: bool = False,
    email: str | None = None,
    db: Session | None = None
) -> Usuario:
    if db is None:
        raise ValueError("db é obrigatório")

    existente = db.query(Usuario).filter(Usuario.login == login).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login já existe"
        )

    usuario = Usuario(
        login=login,
        senha_hash=hash_senha(senha),
        is_avaliador=is_avaliador,
        email=email
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario