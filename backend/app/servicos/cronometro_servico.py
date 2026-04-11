from datetime import datetime, timedelta
from typing import Optional
import asyncio
from sqlalchemy.orm import Session
from app.modelos.cronometro import Cronometro
from app.websockets.gerenciador import gerenciador

# ── Lock em memória ──────────────────────────────────────────────
_lock: dict = {}  # { "avaliador_id": int, "expires_at": datetime }

# ── Task de encerramento agendado ────────────────────────────────
_task_encerramento: Optional[asyncio.Task] = None


# ── Helpers internos ─────────────────────────────────────────────

def _get_ou_criar(db: Session) -> Cronometro:
    c = db.query(Cronometro).filter(Cronometro.id == 1).first()
    if not c:
        c = Cronometro(id=1, ativo=False, duracao_segundos=0, segundos_pausados=0)
        db.add(c)
        db.commit()
        db.refresh(c)
    return c


def calcular_restante(c: Cronometro) -> int:
    if not c.iniciado_em:
        return max(0, c.duracao_segundos)

    if c.ativo:
        agora = datetime.utcnow()
        elapsed = c.segundos_pausados + int((agora - c.iniciado_em).total_seconds())
        return max(0, c.duracao_segundos - elapsed)
    else:
        # Paused — segundos_pausados já contém o total consumido até a pausa
        return max(0, c.duracao_segundos - c.segundos_pausados)


def serializar_estado(c: Cronometro) -> dict:
    restante = calcular_restante(c)
    encerrado = (
        c.duracao_segundos > 0
        and not c.ativo
        and restante == 0
        and c.iniciado_em is not None
    )
    pausado = (
        not c.ativo
        and c.iniciado_em is not None
        and restante > 0
    )
    return {
        "ativo": c.ativo,
        "duracao_segundos": c.duracao_segundos,
        "segundos_restantes": restante,
        "pausado": pausado,
        "encerrado": encerrado,
    }


# ── Task de encerramento natural ─────────────────────────────────

async def _aguardar_encerramento(segundos: int):
    await asyncio.sleep(segundos)

    from app.db.sessao import SessionLocal
    db = SessionLocal()
    try:
        c = db.query(Cronometro).filter(Cronometro.id == 1).first()
        if c and c.ativo:
            # Confirma que realmente expirou (não foi reiniciado entretenimento)
            restante = calcular_restante(c)
            if restante <= 0:
                c.ativo = False
                db.commit()
                db.refresh(c)
                estado = serializar_estado(c)
                await gerenciador.broadcast(estado)
    finally:
        db.close()


def _cancelar_task():
    global _task_encerramento
    if _task_encerramento and not _task_encerramento.done():
        _task_encerramento.cancel()
    _task_encerramento = None


def _agendar_encerramento(segundos: int):
    global _task_encerramento
    _cancelar_task()
    _task_encerramento = asyncio.create_task(_aguardar_encerramento(segundos))


# ── Operações públicas ───────────────────────────────────────────

async def obter_estado(db: Session) -> dict:
    c = _get_ou_criar(db)
    return serializar_estado(c)


async def iniciar(duracao_segundos: int, db: Session) -> dict:
    c = _get_ou_criar(db)
    c.duracao_segundos = duracao_segundos
    c.iniciado_em = datetime.utcnow()
    c.ativo = True
    c.pausado_em = None
    c.segundos_pausados = 0
    db.commit()
    db.refresh(c)

    estado = serializar_estado(c)
    await gerenciador.broadcast(estado)
    _agendar_encerramento(duracao_segundos)
    return estado


async def pausar(db: Session) -> dict:
    c = _get_ou_criar(db)
    if not c.ativo:
        return serializar_estado(c)

    agora = datetime.utcnow()
    elapsed_this_run = int((agora - c.iniciado_em).total_seconds())
    c.segundos_pausados = c.segundos_pausados + elapsed_this_run
    c.ativo = False
    c.pausado_em = agora
    db.commit()
    db.refresh(c)

    _cancelar_task()
    estado = serializar_estado(c)
    await gerenciador.broadcast(estado)
    return estado


async def retomar(db: Session) -> dict:
    c = _get_ou_criar(db)
    if c.ativo:
        return serializar_estado(c)

    restante = calcular_restante(c)
    if restante <= 0:
        return serializar_estado(c)

    c.ativo = True
    c.iniciado_em = datetime.utcnow()
    c.pausado_em = None
    db.commit()
    db.refresh(c)

    estado = serializar_estado(c)
    await gerenciador.broadcast(estado)
    _agendar_encerramento(restante)
    return estado


async def incrementar(segundos: int, db: Session) -> dict:
    c = _get_ou_criar(db)
    c.duracao_segundos = c.duracao_segundos + segundos
    db.commit()
    db.refresh(c)

    estado = serializar_estado(c)
    await gerenciador.broadcast(estado)

    if c.ativo:
        _agendar_encerramento(estado["segundos_restantes"])

    return estado


# ── Lock ─────────────────────────────────────────────────────────

def adquirir_lock(avaliador_id: int) -> bool:
    agora = datetime.utcnow()
    lock_atual_id = _lock.get("avaliador_id")
    lock_expires = _lock.get("expires_at")

    if lock_atual_id == avaliador_id:
        # Renova o próprio lock
        _lock["expires_at"] = agora + timedelta(minutes=5)
        return True

    if lock_atual_id is not None and lock_expires and lock_expires > agora:
        # Outro avaliador tem o lock
        return False

    # Lock livre ou expirado — adquire
    _lock.clear()
    _lock.update({"avaliador_id": avaliador_id, "expires_at": agora + timedelta(minutes=5)})
    return True


def liberar_lock(avaliador_id: int) -> bool:
    if _lock.get("avaliador_id") == avaliador_id:
        _lock.clear()
        return True
    return False


def tem_lock(avaliador_id: int) -> bool:
    agora = datetime.utcnow()
    expires = _lock.get("expires_at")
    return (
        _lock.get("avaliador_id") == avaliador_id
        and expires is not None
        and expires > agora
    )


def lock_info() -> dict:
    """Retorna informações do lock atual (para o frontend saber quem tem o lock)."""
    agora = datetime.utcnow()
    expires = _lock.get("expires_at")
    if _lock and expires and expires > agora:
        return {
            "bloqueado": True,
            "avaliador_id": _lock.get("avaliador_id"),
        }
    return {"bloqueado": False, "avaliador_id": None}
