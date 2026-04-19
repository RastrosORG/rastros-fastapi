from contextlib import asynccontextmanager
import asyncio
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import configuracoes

# Importa todos os modelos para o SQLAlchemy registrar os relacionamentos
import app.db.todos_modelos  # noqa: F401

from app.api.v1.rotas import auth, usuarios, grupos, dossies, respostas, pontuacao, cronometro, chat

_migracao_concluida = False


async def _rodar_migrations():
    global _migracao_concluida
    print("[migrations] iniciando alembic upgrade head...", flush=True)
    proc = await asyncio.create_subprocess_exec(sys.executable, "-m", "alembic", "upgrade", "head")
    codigo = await proc.wait()
    print(f"[migrations] concluído com código {codigo}", flush=True)
    _migracao_concluida = True


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Migrations em background — porta sobe imediatamente (Render não dá timeout)
    asyncio.create_task(_rodar_migrations())
    yield


app = FastAPI(title="Rastros API", version="1.0.0", lifespan=lifespan)

@app.middleware("http")
async def aguardar_migracao(request: Request, call_next):
    # Segura requisições por até 10s enquanto a migration ainda está rodando
    if not _migracao_concluida:
        for _ in range(1200):
            if _migracao_concluida:
                break
            await asyncio.sleep(0.1)
    return await call_next(request)


origins = [o.strip() for o in configuracoes.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(usuarios.router, prefix="/usuarios", tags=["Usuários"])
app.include_router(grupos.router, prefix="/grupos", tags=["Grupos"])
app.include_router(dossies.router, prefix="/dossies", tags=["Dossiês"])
app.include_router(respostas.router, prefix="/respostas", tags=["Respostas"])
app.include_router(pontuacao.router, prefix="/pontuacao", tags=["Pontuação"])
app.include_router(cronometro.router, prefix="/cronometro", tags=["Cronômetro"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"status": "Rastros API online"}