from pydantic import BaseModel, model_validator
from typing import Optional, Any
from datetime import datetime



class ExcluirInput(BaseModel):
    motivo: str


class LogExclusaoUsuarioOutput(BaseModel):
    id: int
    tipo: str
    nome_usuario: str
    grupo_nome: str
    excluido_em: datetime
    avaliador_nome: str
    motivo: str

    class Config:
        from_attributes = True

class UsuarioResumo(BaseModel):
    id: int
    login: str
    nome_custom: Optional[str] = None
    nome_alterado: bool = False

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
    nome_custom: Optional[str] = None
    nome_alterado: bool = False
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

class AtualizarNomeGrupoInput(BaseModel):
    nome_custom: str

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

class AdicionarMembroOutput(BaseModel):
    credencial: UsuarioCredencial


class CredencialOutput(BaseModel):
    id: int
    login: str
    senha: str
    grupo_id: int
    grupo_nome: str

    class Config:
        from_attributes = True


class ListarCredenciaisOutput(BaseModel):
    credenciais: list[CredencialOutput]
    ultima_atualizacao: Optional[datetime] = None