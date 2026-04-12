from fastapi import APIRouter, Depends, Form, File, UploadFile
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.dependencias import get_db, get_usuario_atual, get_avaliador
from app.schemas.resposta import (
    RespostaOutput,
    DossieRespostasOutput,
    GrupoResumoPendentesOutput,
    AvaliarRespostaInput,
)
from app.servicos import resposta_servico

router = APIRouter()


# ── Usuário comum ─────────────────────────────────────────────────

@router.post("/{dossie_id}", response_model=RespostaOutput)
def enviar_resposta(
    dossie_id: int,
    titulo: str = Form(...),
    descricao: str = Form(...),
    categoria: str = Form(...),
    link: Optional[str] = Form(None),
    arquivos: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    return resposta_servico.criar_resposta(
        dossie_id=dossie_id,
        titulo=titulo,
        descricao=descricao,
        categoria=categoria,
        link=link,
        arquivos=arquivos,
        usuario_id=int(usuario_atual.id),
        db=db,
    )


@router.get("/minhas", response_model=List[DossieRespostasOutput])
def minhas_respostas(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual),
):
    return resposta_servico.listar_minhas_respostas(int(usuario_atual.id), db)


# ── Avaliador ─────────────────────────────────────────────────────

@router.get("/meus-grupos", response_model=List[GrupoResumoPendentesOutput])
def meus_grupos(
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    return resposta_servico.listar_grupos_do_avaliador(int(avaliador.id), db)


@router.get("/grupo/{grupo_id}", response_model=List[RespostaOutput])
def respostas_do_grupo(
    grupo_id: int,
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    return resposta_servico.listar_respostas_grupo(grupo_id, int(avaliador.id), db)


@router.patch("/{resposta_id}/avaliar", response_model=RespostaOutput)
def avaliar(
    resposta_id: int,
    dados: AvaliarRespostaInput,
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    return resposta_servico.avaliar_resposta(
        resposta_id=resposta_id,
        tipo=dados.tipo,
        comentario=dados.comentario,
        categoria_nova=dados.categoria_nova,
        avaliador_id=int(avaliador.id),
        db=db,
    )
