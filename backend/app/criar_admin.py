import app.db.todos_modelos  # carrega todos os modelos antes de qualquer query
from app.db.sessao import SessionLocal
from app.servicos.auth_servico import criar_usuario

db = SessionLocal()

criar_usuario(
    login="admin",
    senha="admin123",
    is_avaliador=True,
    email="admin@rastros.com",
    db=db
)

print("Avaliador criado com sucesso!")
db.close()