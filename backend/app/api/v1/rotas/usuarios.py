from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_usuario_atual
from app.schemas.usuario import AtualizarNomeInput, UsuarioNomeOutput
from app.servicos import usuario_servico

router = APIRouter()

@router.patch("/nome", response_model=UsuarioNomeOutput)
def atualizar_nome(
    dados: AtualizarNomeInput,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual)
):
    return usuario_servico.atualizar_nome(int(usuario_atual.id), dados.nome_custom, db)
