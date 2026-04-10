from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ArquivoDossieOutput(BaseModel):
    id: int
    nome_arquivo: str
    url_s3: str

    class Config:
        from_attributes = True

class DossieBase(BaseModel):
    nome: str
    descricao: str
    data_nascimento: Optional[date] = None
    data_desaparecimento: date
    local: str
    coordenadas: Optional[str] = None

class DossieCreate(DossieBase):
    pass

class DossieUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    data_nascimento: Optional[date] = None
    data_desaparecimento: Optional[date] = None
    local: Optional[str] = None
    coordenadas: Optional[str] = None
    ativo: Optional[bool] = None

class DossieOutput(DossieBase):
    id: int
    ativo: bool
    foto_url: Optional[str] = None
    criado_em: datetime
    arquivos: list[ArquivoDossieOutput] = []
    total_respostas: int = 0

    class Config:
        from_attributes = True