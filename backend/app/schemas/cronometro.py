from pydantic import BaseModel


class IniciarInput(BaseModel):
    duracao_segundos: int


class IncrementarInput(BaseModel):
    segundos: int


class CronometroEstado(BaseModel):
    ativo: bool
    duracao_segundos: int
    segundos_restantes: int
    pausado: bool
    encerrado: bool
