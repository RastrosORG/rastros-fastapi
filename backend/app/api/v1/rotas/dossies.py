from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_avaliador, get_usuario_atual
from app.schemas.dossie import DossieCreate, DossieUpdate, DossieOutput
from app.servicos import dossie_servico, storage_servico

router = APIRouter()

@router.get("/", response_model=list[DossieOutput])
def listar(
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual)
):
    # Avaliador vê todos, usuário comum vê só ativos
    apenas_ativos = not usuario_atual.is_avaliador
    dossies = dossie_servico.listar_dossies(db, apenas_ativos=apenas_ativos)

    # Adiciona contagem de respostas em cada dossiê
    resultado = []
    for d in dossies:
        d_dict = DossieOutput.model_validate(d)
        d_dict.total_respostas = dossie_servico.contar_respostas(int(d.id), db)
        resultado.append(d_dict)
    return resultado

@router.get("/{dossie_id}", response_model=DossieOutput)
def buscar(
    dossie_id: int,
    db: Session = Depends(get_db),
    usuario_atual=Depends(get_usuario_atual)
):
    return dossie_servico.buscar_dossie(dossie_id, db)

@router.post("/", response_model=DossieOutput)
def criar(
    dados: DossieCreate,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return dossie_servico.criar_dossie(dados, db)

@router.put("/{dossie_id}", response_model=DossieOutput)
def atualizar(
    dossie_id: int,
    dados: DossieUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return dossie_servico.atualizar_dossie(dossie_id, dados, db)

@router.patch("/{dossie_id}/arquivar", response_model=DossieOutput)
def arquivar(
    dossie_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    return dossie_servico.arquivar_dossie(dossie_id, db)

@router.post("/{dossie_id}/arquivos", response_model=DossieOutput)
def upload_arquivo(
    dossie_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_avaliador)
):
    nome, url = storage_servico.upload_arquivo(arquivo, f"dossies/{dossie_id}")
    dossie_servico.adicionar_arquivo(dossie_id, nome, url, db)
    return dossie_servico.buscar_dossie(dossie_id, db)