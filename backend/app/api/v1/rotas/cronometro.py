from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_avaliador, get_usuario_atual
from app.core.seguranca import verificar_token
from app.schemas.cronometro import IniciarInput, IncrementarInput, CronometroEstado
from app.servicos import cronometro_servico
from app.websockets.gerenciador import gerenciador

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────

def _exigir_lock(avaliador_id: int):
    if not cronometro_servico.tem_lock(avaliador_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Você não possui o controle do cronômetro. Adquira o lock primeiro.",
        )


# ── REST endpoints ────────────────────────────────────────────────

@router.get("/estado", response_model=CronometroEstado)
async def estado(
    db: Session = Depends(get_db),
    _usuario=Depends(get_usuario_atual),
):
    return await cronometro_servico.obter_estado(db)


@router.post("/lock")
async def adquirir_lock(avaliador=Depends(get_avaliador)):
    sucesso = cronometro_servico.adquirir_lock(int(avaliador.id))
    if not sucesso:
        info = cronometro_servico.lock_info()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cronômetro em uso por outro avaliador (id={info['avaliador_id']}).",
        )
    return {"sucesso": True}


@router.delete("/lock")
async def liberar_lock(avaliador=Depends(get_avaliador)):
    cronometro_servico.liberar_lock(int(avaliador.id))
    return {"sucesso": True}


@router.get("/lock")
async def estado_lock(_avaliador=Depends(get_avaliador)):
    return cronometro_servico.lock_info()


@router.post("/iniciar", response_model=CronometroEstado)
async def iniciar(
    dados: IniciarInput,
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    _exigir_lock(int(avaliador.id))
    return await cronometro_servico.iniciar(dados.duracao_segundos, db)


@router.post("/pausar", response_model=CronometroEstado)
async def pausar(
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    _exigir_lock(int(avaliador.id))
    return await cronometro_servico.pausar(db)


@router.post("/retomar", response_model=CronometroEstado)
async def retomar(
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    _exigir_lock(int(avaliador.id))
    return await cronometro_servico.retomar(db)


@router.post("/incrementar", response_model=CronometroEstado)
async def incrementar(
    dados: IncrementarInput,
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    _exigir_lock(int(avaliador.id))
    return await cronometro_servico.incrementar(dados.segundos, db)


# ── WebSocket ─────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_cronometro(
    websocket: WebSocket,
    token: str = Query(...),
):
    from app.db.sessao import SessionLocal

    payload = verificar_token(token)
    if payload is None:
        await websocket.accept()
        await websocket.close(code=4001)
        return

    # Sessão de curta duração — só para buscar o estado inicial
    db = SessionLocal()
    try:
        estado = await cronometro_servico.obter_estado(db)
    finally:
        db.close()

    await gerenciador.conectar(websocket)
    try:
        await websocket.send_json(estado)

        while True:
            msg = await websocket.receive()
            if msg["type"] == "websocket.disconnect":
                break
    except WebSocketDisconnect:
        pass
    finally:
        gerenciador.desconectar(websocket)
