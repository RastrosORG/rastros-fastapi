from pydantic import BaseModel
from typing import Optional


class AtualizarNomeInput(BaseModel):
    nome_custom: str


class UsuarioNomeOutput(BaseModel):
    id: int
    login: str
    nome_custom: Optional[str] = None
    nome_alterado: bool = False

    class Config:
        from_attributes = True
