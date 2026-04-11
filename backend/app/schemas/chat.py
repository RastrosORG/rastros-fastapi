from pydantic import BaseModel
from typing import List


class MensagemOutput(BaseModel):
    id: int
    texto: str
    autor: str
    hora: str   # "HH:MM"
    tipo: str   # "grupo" | "avaliador" | "sistema"


class GrupoChatOutput(BaseModel):
    id: int
    nome: str
    chamou_avaliador: bool
    avaliador_presente: bool
    ultima_mensagem: str
    ultima_hora: str
