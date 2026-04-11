from pydantic import BaseModel
from typing import Optional

class LoginInput(BaseModel):
    login: str
    senha: str

class TokenOutput(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_avaliador: bool
    usuario_id: int
    login: str

class CadastroAvaliadorInput(BaseModel):
    login: str
    senha: str
    email: str
    chave_acesso: str

class UsuarioBase(BaseModel):
    login: str
    is_avaliador: bool = False
    email: Optional[str] = None

class UsuarioOutput(UsuarioBase):
    id: int
    ativo: bool

    class Config:
        from_attributes = True