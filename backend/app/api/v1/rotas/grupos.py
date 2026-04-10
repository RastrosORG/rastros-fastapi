from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_avaliador, get_usuario_atual
from app.schemas.grupo import GrupoOutput, GerarUsuariosInput, GerarUsuariosOutput
from app.servicos import grupo_servico

router = APIRouter()

@router.get("/", response_model=list[GrupoOutput])
def listar(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_avaliador)
):
    return grupo_servico.listar_grupos(db, avaliador_id=int(usuario_atual.id))

@router.get("/todos", response_model=list[GrupoOutput])
def listar_todos(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return grupo_servico.listar_grupos(db)

@router.get("/{grupo_id}", response_model=GrupoOutput)
def buscar(
    grupo_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual)
):
    return grupo_servico.buscar_grupo(grupo_id, db)

@router.patch("/{grupo_id}/transferir/{avaliador_id}", response_model=GrupoOutput)
def transferir(
    grupo_id: int,
    avaliador_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return grupo_servico.transferir_grupo(grupo_id, avaliador_id, db)

@router.patch("/membro/{usuario_id}/mover/{grupo_id}", response_model=GrupoOutput)
def mover_membro(
    usuario_id: int,
    grupo_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return grupo_servico.mover_membro(usuario_id, grupo_id, db)

@router.post("/gerar", response_model=GerarUsuariosOutput)
def gerar_usuarios(
    dados: GerarUsuariosInput,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_avaliador)
):
    return grupo_servico.gerar_usuarios(
        dados.quantidade,
        int(usuario_atual.id),
        db
    )