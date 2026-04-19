from fastapi import WebSocket
from collections import defaultdict


class ConnectionManager:
    def __init__(self):
        # grupo_id → lista de sockets (usuários + avaliador quando entrou)
        self.grupos: dict[int, list[WebSocket]] = defaultdict(list)
        # avaliador_id → socket de notificações
        self.avaliadores: dict[int, WebSocket] = {}
        # usuario_id → socket do grupo (apenas usuários comuns, para notificações diretas)
        self.usuarios: dict[int, WebSocket] = {}

    # ── Grupos ────────────────────────────────────────────────────────

    async def connect_grupo(self, ws: WebSocket, grupo_id: int):
        await ws.accept()
        self.grupos[grupo_id].append(ws)

    def disconnect_grupo(self, ws: WebSocket, grupo_id: int):
        try:
            self.grupos[grupo_id].remove(ws)
        except ValueError:
            pass

    async def broadcast_grupo(self, grupo_id: int, dados: dict):
        for ws in list(self.grupos[grupo_id]):
            try:
                await ws.send_json(dados)
            except Exception:
                self.disconnect_grupo(ws, grupo_id)

    # ── Usuários (notificação direta) ────────────────────────────────

    def register_usuario(self, usuario_id: int, ws: WebSocket):
        self.usuarios[usuario_id] = ws

    def unregister_usuario(self, usuario_id: int, ws: WebSocket):
        # Remove apenas se o socket registrado ainda é este (evita remover reconexão mais nova)
        if self.usuarios.get(usuario_id) is ws:
            self.usuarios.pop(usuario_id, None)

    async def notificar_usuario(self, usuario_id: int, dados: dict):
        ws = self.usuarios.get(usuario_id)
        if ws:
            try:
                await ws.send_json(dados)
            except Exception:
                self.unregister_usuario(usuario_id, ws)

    # ── Avaliador (canal de notificações) ────────────────────────────

    async def connect_avaliador(self, ws: WebSocket, avaliador_id: int):
        await ws.accept()
        self.avaliadores[avaliador_id] = ws

    def disconnect_avaliador(self, avaliador_id: int):
        self.avaliadores.pop(avaliador_id, None)

    async def notificar_avaliador(self, avaliador_id: int, dados: dict):
        ws = self.avaliadores.get(avaliador_id)
        if ws:
            try:
                await ws.send_json(dados)
            except Exception:
                self.disconnect_avaliador(avaliador_id)


manager = ConnectionManager()
