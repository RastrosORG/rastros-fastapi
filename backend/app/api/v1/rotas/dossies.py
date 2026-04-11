from typing import List
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.dependencias import get_db, get_avaliador, get_usuario_atual
from app.schemas.dossie import DossieCreate, DossieUpdate, DossieOutput
from app.schemas.log_exclusao import LogExclusaoOutput, ExcluirDossieInput
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

    # Contagem em lote — 1 query GROUP BY para todos os dossiês
    dossie_ids = [int(d.id) for d in dossies]
    contagens = dossie_servico.contar_respostas_em_lote(dossie_ids, db)
    resultado = []
    for d in dossies:
        d_dict = DossieOutput.model_validate(d)
        d_dict.total_respostas = contagens.get(int(d.id), 0)
        resultado.append(d_dict)
    return resultado

@router.get("/log-exclusoes", response_model=List[LogExclusaoOutput])
def listar_log(
    db: Session = Depends(get_db),
    _=Depends(get_avaliador),
):
    return dossie_servico.listar_log_exclusoes(db)


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


@router.delete("/{dossie_id}", status_code=204)
def excluir_permanente(
    dossie_id: int,
    body: ExcluirDossieInput,
    db: Session = Depends(get_db),
    avaliador=Depends(get_avaliador),
):
    dossie_servico.excluir_dossie_permanente(
        dossie_id=dossie_id,
        avaliador_login=str(avaliador.login),
        motivo=body.motivo,
        db=db,
    )