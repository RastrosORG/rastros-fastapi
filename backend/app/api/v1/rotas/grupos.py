from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_avaliador, get_usuario_atual
from app.websockets.manager import manager
from app.schemas.grupo import (
    GrupoOutput, GerarUsuariosInput, GerarUsuariosOutput,
    AdicionarMembroOutput, AtualizarNomeGrupoInput,
    ExcluirInput, LogExclusaoUsuarioOutput, ListarCredenciaisOutput,
    ReorganizarInput, LockEdicaoStatus,
)
from app.servicos import grupo_servico

router = APIRouter()

@router.get("/", response_model=list[GrupoOutput])
def listar(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_avaliador)
):
    return grupo_servico.listar_grupos(db, avaliador_id=int(usuario_atual.id))

@router.get("/meu", response_model=GrupoOutput)
def meu_grupo(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual)
):
    return grupo_servico.meu_grupo(int(usuario_atual.id), db)

@router.patch("/{grupo_id}/nome", response_model=GrupoOutput)
def atualizar_nome_grupo(
    grupo_id: int,
    dados: AtualizarNomeGrupoInput,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual)
):
    return grupo_servico.atualizar_nome_grupo(grupo_id, dados.nome_custom, int(usuario_atual.id), db)

@router.get("/todos", response_model=list[GrupoOutput])
def listar_todos(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return grupo_servico.listar_grupos(db)

# Literal antes de parametrizado — evita que FastAPI trate strings como grupo_id
@router.post("/lock", status_code=204)
def adquirir_lock(
    usuario_atual=Depends(get_avaliador)
):
    grupo_servico.adquirir_lock_edicao(int(usuario_atual.id), str(usuario_atual.login))


@router.delete("/lock", status_code=204)
def liberar_lock(
    usuario_atual=Depends(get_avaliador)
):
    grupo_servico.liberar_lock_edicao(int(usuario_atual.id))


@router.get("/lock", response_model=LockEdicaoStatus)
def status_lock():
    lock = grupo_servico.status_lock_edicao()
    if lock:
        return LockEdicaoStatus(bloqueado=True, avaliador_id=lock["avaliador_id"], avaliador_nome=lock["avaliador_nome"])
    return LockEdicaoStatus(bloqueado=False)


@router.post("/reorganizar", status_code=204)
async def reorganizar(
    dados: ReorganizarInput,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    grupo_servico.reorganizar_membros(dados.movimentos, db)
    for mov in dados.movimentos:
        await manager.notificar_usuario(mov.usuario_id, {
            "evento": "trocar_grupo",
            "grupo_id": mov.grupo_id,
        })


@router.get("/credenciais", response_model=ListarCredenciaisOutput)
def listar_credenciais(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return grupo_servico.listar_credenciais(db)


@router.get("/log-exclusoes", response_model=list[LogExclusaoUsuarioOutput])
def listar_log_exclusoes(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return grupo_servico.listar_log_exclusoes_usuarios(db)

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
async def mover_membro(
    usuario_id: int,
    grupo_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    resultado = grupo_servico.mover_membro(usuario_id, grupo_id, db)
    await manager.notificar_usuario(usuario_id, {
        "evento": "trocar_grupo",
        "grupo_id": grupo_id,
    })
    return resultado

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

@router.post("/adicionar-membro", response_model=AdicionarMembroOutput)
async def adicionar_membro(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    resultado = grupo_servico.adicionar_membro(db)
    for uid in resultado.membros_movidos:
        await manager.notificar_usuario(uid, {
            "evento": "trocar_grupo",
            "grupo_id": resultado.credencial.grupo_id,
        })
    return resultado

# /usuario/{id} antes de /{grupo_id} para evitar ambiguidade no DELETE
@router.delete("/usuario/{usuario_id}", status_code=204)
def excluir_usuario(
    usuario_id: int,
    dados: ExcluirInput,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_avaliador),
):
    grupo_servico.excluir_usuario_permanente(
        usuario_id, dados.motivo, str(usuario_atual.login), db
    )

@router.delete("/{grupo_id}", status_code=204)
def excluir_grupo(
    grupo_id: int,
    dados: ExcluirInput,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_avaliador),
):
    grupo_servico.excluir_grupo_permanente(
        grupo_id, dados.motivo, str(usuario_atual.login), db
    )