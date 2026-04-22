from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_usuario_atual, get_avaliador
from app.schemas.usuario import AtualizarNomeInput, UsuarioNomeOutput, AvaliadorOutput
from app.servicos import usuario_servico
from app.modelos.usuario import Usuario

router = APIRouter()

@router.patch("/nome", response_model=UsuarioNomeOutput)
def atualizar_nome(
    dados: AtualizarNomeInput,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual)
):
    return usuario_servico.atualizar_nome(int(usuario_atual.id), dados.nome_custom, db)


@router.get("/avaliadores", response_model=list[AvaliadorOutput])
def listar_avaliadores(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return (
        db.query(Usuario)
        .filter(Usuario.is_avaliador == True, Usuario.ativo == True)
        .order_by(Usuario.login)
        .all()
    )
