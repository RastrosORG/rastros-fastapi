from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime


class ArquivoRespostaOutput(BaseModel):
    id: int
    nome_arquivo: str
    url_s3: str

    model_config = {"from_attributes": True}


class AvaliacaoOutput(BaseModel):
    comentario: str
    categoria_original: Optional[str] = None
    categoria_nova: Optional[str] = None
    pontos: int


class RespostaOutput(BaseModel):
    id: int
    titulo: str
    descricao: str
    categoria: str
    link: Optional[str] = None
    grupo_id: int
    dossie_id: int
    dossie_nome: str
    status: str
    criado_em: datetime
    arquivos: List[ArquivoRespostaOutput]
    avaliacao: Optional[AvaliacaoOutput] = None


class DossieRespostasOutput(BaseModel):
    dossie_id: int
    dossie_nome: str
    respostas: List[RespostaOutput]


class GrupoResumoPendentesOutput(BaseModel):
    grupo_id: int
    grupo_nome: str
    total: int
    pendentes: int


class AvaliarRespostaInput(BaseModel):
    tipo: Literal['aprovada', 'aprovada_parcial', 'rejeitada']
    comentario: str
    categoria_nova: Optional[str] = None
