from pydantic import BaseModel
from datetime import datetime


class LogExclusaoOutput(BaseModel):
    id: int
    nome_dossie: str
    criado_em: datetime
    excluido_em: datetime
    avaliador_nome: str
    motivo: str

    class Config:
        from_attributes = True


class ExcluirDossieInput(BaseModel):
    motivo: str
