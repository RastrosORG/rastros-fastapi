import { api } from '../lib/axios'

export interface DossieAPI {
  id: number
  nome: string
  descricao: string
  data_nascimento?: string
  data_desaparecimento: string
  local: string
  coordenadas?: string
  foto_url?: string
  ativo: boolean
  arquivos: { id: number; nome_arquivo: string; url_s3: string }[]
}

export interface DossieCreateInput {
  nome: string
  descricao: string
  data_nascimento?: string
  data_desaparecimento: string
  local: string
  coordenadas?: string
}

export async function listarDossies(): Promise<DossieAPI[]> {
  const res = await api.get<DossieAPI[]>('/dossies/')
  return res.data
}

export async function criarDossie(dados: DossieCreateInput): Promise<DossieAPI> {
  const res = await api.post<DossieAPI>('/dossies/', dados)
  return res.data
}

export async function atualizarDossie(id: number, dados: Partial<DossieCreateInput>): Promise<DossieAPI> {
  const res = await api.put<DossieAPI>(`/dossies/${id}`, dados)
  return res.data
}

export async function arquivarDossie(id: number): Promise<DossieAPI> {
  const res = await api.patch<DossieAPI>(`/dossies/${id}/arquivar`)
  return res.data
}

export async function excluirDossie(id: number, motivo: string): Promise<void> {
  await api.delete(`/dossies/${id}`, { data: { motivo } })
}

export interface LogExclusaoAPI {
  id: number
  nome_dossie: string
  criado_em: string
  excluido_em: string
  avaliador_nome: string
  motivo: string
}

export async function listarLogExclusoes(): Promise<LogExclusaoAPI[]> {
  const res = await api.get<LogExclusaoAPI[]>('/dossies/log-exclusoes')
  return res.data
}

export async function uploadFotoDossie(dossieId: number, foto: File): Promise<DossieAPI> {
  const formData = new FormData()
  formData.append('arquivo', foto)
  const res = await api.post<DossieAPI>(`/dossies/${dossieId}/foto`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadArquivoDossie(dossieId: number, arquivo: File): Promise<DossieAPI> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const res = await api.post<DossieAPI>(`/dossies/${dossieId}/arquivos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}