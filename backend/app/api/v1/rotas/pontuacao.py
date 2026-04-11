from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencias import get_db, get_usuario_atual
from app.schemas.pontuacao import RankingCompletoOutput
from app.servicos import pontuacao_servico

router = APIRouter()


@router.get("/ranking", response_model=RankingCompletoOutput)
def ranking_completo(
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual),
):
    return pontuacao_servico.listar_ranking_completo(db)
