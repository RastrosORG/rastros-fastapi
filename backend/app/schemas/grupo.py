from pydantic import BaseModel, model_validator
from typing import Optional, Any
from datetime import datetime

class UsuarioResumo(BaseModel):
    id: int
    login: str

    class Config:
        from_attributes = True

class MembroOutput(BaseModel):
    id: int
    usuario: UsuarioResumo

    class Config:
        from_attributes = True

class GrupoOutput(BaseModel):
    id: int
    nome: str
    avaliador_id: int
    avaliador_nome: str = ""
    criado_em: datetime
    membros: list[MembroOutput] = []

    @model_validator(mode='before')
    @classmethod
    def extrair_avaliador_nome(cls, data: Any) -> Any:
        if hasattr(data, 'avaliador') and data.avaliador:
            data.__dict__['avaliador_nome'] = str(data.avaliador.login)
        return data

    class Config:
        from_attributes = True

class GrupoCreate(BaseModel):
    nome: str
    avaliador_id: int

class GrupoUpdate(BaseModel):
    nome: Optional[str] = None
    avaliador_id: Optional[int] = None

class GerarUsuariosInput(BaseModel):
    quantidade: int

class UsuarioCredencial(BaseModel):
    id: int
    login: str
    senha: str
    grupo_id: int
    grupo_nome: str

class GerarUsuariosOutput(BaseModel):
    grupos_criados: int
    usuarios_criados: int
    credenciais: list[UsuarioCredencial]