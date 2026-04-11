from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modelos.usuario import Usuario
from app.schemas.usuario import UsuarioNomeOutput


def atualizar_nome(usuario_id: int, nome_custom: str, db: Session) -> Usuario:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if usuario.nome_alterado:
        raise HTTPException(status_code=400, detail="O nome já foi alterado e não pode ser mudado novamente")

    nome = nome_custom.strip()
    if len(nome) < 2:
        raise HTTPException(status_code=400, detail="Nome muito curto")

    usuario.nome_custom = nome  # type: ignore
    usuario.nome_alterado = True  # type: ignore
    db.commit()
    db.refresh(usuario)
    return usuario
