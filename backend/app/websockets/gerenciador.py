from fastapi import WebSocket


class GerenciadorConexoes:
    def __init__(self):
        self.conexoes_ativas: list[WebSocket] = []

    async def conectar(self, websocket: WebSocket):
        await websocket.accept()
        self.conexoes_ativas.append(websocket)

    def desconectar(self, websocket: WebSocket):
        if websocket in self.conexoes_ativas:
            self.conexoes_ativas.remove(websocket)

    async def broadcast(self, mensagem: dict):
        para_remover = []
        for conexao in self.conexoes_ativas:
            try:
                await conexao.send_json(mensagem)
            except Exception:
                para_remover.append(conexao)
        for conexao in para_remover:
            self.desconectar(conexao)


gerenciador = GerenciadorConexoes()
