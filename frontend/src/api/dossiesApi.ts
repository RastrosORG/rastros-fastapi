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
  total_respostas: number
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