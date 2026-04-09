from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa todos os modelos para o SQLAlchemy registrar os relacionamentos
import app.db.todos_modelos  # noqa: F401

from app.api.v1.rotas import auth, usuarios, grupos, dossies, respostas, pontuacao, cronometro, chat

app = FastAPI(title="Rastros API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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