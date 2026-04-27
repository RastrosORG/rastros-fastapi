import asyncio
from datetime import datetime
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from typing import List
from sqlalchemy.orm import Session

from app.core.dependencias import get_db, get_avaliador
from app.core.seguranca import verificar_token
from app.modelos.usuario import Usuario
from app.modelos.grupo import Grupo
from app.schemas.chat import GrupoChatOutput, MensagemOutput
from app.servicos import chat_servico
from app.websockets.manager import manager

router = APIRouter()

PING_INTERVAL = 20  # segundos entre pings de keepalive


def _usuario_do_token(token: str, db: Session) -> Usuario | None:
    payload = verificar_token(token)
    if not payload:
        return None
    return db.query(Usuario).filter(Usuario.id == payload.get("sub")).first()


# ── REST ──────────────────────────────────────────────────────────────

@router.get("/grupos", response_model=List[GrupoChatOutput])
def listar_grupos(
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    return chat_servico.listar_grupos_avaliador(int(avaliador.id), db)


@router.get("/grupos/{grupo_id}/historico", response_model=List[MensagemOutput])
def historico_rest(
    grupo_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador),
):
    return chat_servico.historico(grupo_id, db)


# ── WebSocket: canal do grupo ─────────────────────────────────────────
#
# Client → Server:
#   {"texto": "..."}       envia mensagem
#   {"acao": "chamar"}     usuário chama avaliador
#   {"acao": "entrar"}     avaliador entra no chat
#   {"acao": "sair"}       avaliador sai do chat
#
# Server → Client:
#   {"evento": "historico",        "dados": [...], "avaliador_presente": bool, "chamou_avaliador": bool}
#   {"evento": "mensagem",         "dados": {id, texto, autor, hora, tipo}}
#   {"evento": "avaliador_entrou", "dados": {id, texto, autor, hora, tipo}}
#   {"evento": "avaliador_saiu",   "dados": {id, texto, autor, hora, tipo}}
#   {"evento": "ping"}

@router.websocket("/ws/grupo/{grupo_id}")
async def ws_grupo(
    websocket: WebSocket,
    grupo_id: int,
    token: str = Query(...),
):
    from app.db.sessao import SessionLocal

    usuario: Usuario | None = None
    avaliador_ativo = False

    # Sessão de curta duração — só para autenticação e dados iniciais
    db = SessionLocal()
    try:
        usuario = await asyncio.to_thread(_usuario_do_token, token, db)
        if not usuario:
            db.close()
            await websocket.close(code=4001)
            return

        grupo = await asyncio.to_thread(db.get, Grupo, grupo_id)

        if not usuario.is_avaliador:
            hist = await asyncio.to_thread(chat_servico.historico, grupo_id, db)
            avaliador_presente = grupo.avaliador_presente if grupo else False
            chamou_avaliador = grupo.chamou_avaliador if grupo else False
        else:
            hist = []
            avaliador_presente = False
            chamou_avaliador = False
    finally:
        db.close()

    await manager.connect_grupo(websocket, grupo_id)

    if not usuario.is_avaliador:
        manager.register_usuario(int(usuario.id), websocket)

    await websocket.send_json({
        "evento": "historico",
        "dados": hist,
        "avaliador_presente": avaliador_presente,
        "chamou_avaliador": chamou_avaliador,
    })

    async def keepalive():
        while True:
            await asyncio.sleep(PING_INTERVAL)
            try:
                await websocket.send_json({"evento": "ping"})
            except Exception:
                break

    ping_task = asyncio.create_task(keepalive())

    try:
        while True:
            data = await websocket.receive_json()
            acao = data.get("acao")
            texto = (data.get("texto") or "").strip()

            # Sessão de curta duração — só para esta operação
            db = SessionLocal()
            try:
                if acao == "chamar" and not usuario.is_avaliador:
                    await asyncio.to_thread(chat_servico.marcar_chamada, grupo_id, db)
                    grupo = await asyncio.to_thread(db.get, Grupo, grupo_id)
                    if grupo:
                        await manager.notificar_avaliador(int(grupo.avaliador_id), {
                            "evento": "chamada",
                            "grupo_id": grupo_id,
                            "grupo_nome": grupo.nome_custom or grupo.nome,
                        })

                elif acao == "entrar" and usuario.is_avaliador:
                    await asyncio.to_thread(chat_servico.entrar_chat, grupo_id, db)
                    avaliador_ativo = True
                    dados_msg = await asyncio.to_thread(
                        chat_servico.salvar_mensagem,
                        grupo_id, None, "O avaliador entrou no chat.", False, True, db,
                    )
                    await manager.broadcast_grupo(grupo_id, {
                        "evento": "avaliador_entrou",
                        "dados": dados_msg,
                    })

                elif acao == "sair" and usuario.is_avaliador and avaliador_ativo:
                    await asyncio.to_thread(chat_servico.sair_chat, grupo_id, db)
                    avaliador_ativo = False
                    dados_msg = await asyncio.to_thread(
                        chat_servico.salvar_mensagem,
                        grupo_id, None, "O avaliador saiu do chat.", False, True, db,
                    )
                    await manager.broadcast_grupo(grupo_id, {
                        "evento": "avaliador_saiu",
                        "dados": dados_msg,
                    })

                elif texto:
                    is_av = bool(usuario.is_avaliador)
                    dados_msg = await asyncio.to_thread(
                        chat_servico.salvar_mensagem,
                        grupo_id, int(usuario.id), texto, is_av, False, db,
                    )
                    await manager.broadcast_grupo(grupo_id, {
                        "evento": "mensagem",
                        "dados": dados_msg,
                    })
            finally:
                db.close()

    except WebSocketDisconnect:
        pass
    finally:
        ping_task.cancel()
        manager.disconnect_grupo(websocket, grupo_id)
        if usuario and not usuario.is_avaliador:
            manager.unregister_usuario(int(usuario.id), websocket)

        # Avaliador desconectou sem sair explicitamente — limpa o estado
        if usuario and usuario.is_avaliador and avaliador_ativo:
            db = SessionLocal()
            try:
                await asyncio.to_thread(chat_servico.sair_chat, grupo_id, db)
                dados_msg = await asyncio.to_thread(
                    chat_servico.salvar_mensagem,
                    grupo_id, None, "O avaliador saiu do chat.", False, True, db,
                )
            finally:
                db.close()
            await manager.broadcast_grupo(grupo_id, {
                "evento": "avaliador_saiu",
                "dados": dados_msg,
            })


# ── WebSocket: canal de notificações do avaliador ────────────────────
#
# Server → Avaliador:
#   {"evento": "chamada", "grupo_id": int, "grupo_nome": str}
#   {"evento": "ping"}

@router.websocket("/ws/avaliador")
async def ws_avaliador(
    websocket: WebSocket,
    token: str = Query(...),
):
    from app.db.sessao import SessionLocal

    # Sessão de curta duração — só para autenticação
    db = SessionLocal()
    try:
        usuario = await asyncio.to_thread(_usuario_do_token, token, db)
    finally:
        db.close()

    if not usuario or not usuario.is_avaliador:
        await websocket.close(code=4001)
        return

    await manager.connect_avaliador(websocket, int(usuario.id))

    async def keepalive():
        while True:
            await asyncio.sleep(PING_INTERVAL)
            try:
                await websocket.send_json({"evento": "ping"})
            except Exception:
                break

    ping_task = asyncio.create_task(keepalive())

    try:
        while True:
            # Canal só recebe — mantém a conexão viva respondendo ao browser
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ping_task.cancel()
        manager.disconnect_avaliador(int(usuario.id))
