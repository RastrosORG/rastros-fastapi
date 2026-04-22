from pydantic import BaseModel
from typing import List, Dict


class GrupoPontuacaoOutput(BaseModel):
    grupo_id: int
    nome: str
    pontos: int
    respostas: int
    aprovadas: int
    rejeitadas: int
    parciais: int


class IntervaloDadosOutput(BaseModel):
    rotulo: str
    dados: Dict[str, int]


class RankingCompletoOutput(BaseModel):
    ranking: List[GrupoPontuacaoOutput]
    atividade: List[IntervaloDadosOutput]
    evolucao: List[IntervaloDadosOutput]
    desempenho: List[IntervaloDadosOutput]
