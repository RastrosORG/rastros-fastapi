import { api } from '../lib/axios'

export interface ArquivoRespostaAPI {
  id: number
  nome_arquivo: string
  url_s3: string
}

export interface AvaliacaoAPI {
  comentario: string
  categoria_original: string | null
  categoria_nova: string | null
  pontos: number
}

export interface RespostaAPI {
  id: number
  titulo: string
  descricao: string
  categoria: string
  link: string | null
  grupo_id: number
  dossie_id: number
  dossie_nome: string
  status: 'pendente' | 'aprovada' | 'aprovada_parcial' | 'rejeitada'
  criado_em: string
  arquivos: ArquivoRespostaAPI[]
  avaliacao: AvaliacaoAPI | null
}

export interface DossieRespostasAPI {
  dossie_id: number
  dossie_nome: string
  respostas: RespostaAPI[]
}

export interface GrupoResumoPendentesAPI {
  grupo_id: number
  grupo_nome: string
  total: number
  pendentes: number
}

// ── Usuário comum ─────────────────────────────────────────────────

export async function listarMinhasRespostas(): Promise<DossieRespostasAPI[]> {
  const res = await api.get<DossieRespostasAPI[]>('/respostas/minhas')
  return res.data
}

export async function enviarResposta(
  dossieId: number,
  form: {
    titulo: string
    descricao: string
    categoria: string
    link?: string
    arquivos: File[]
  }
): Promise<RespostaAPI> {
  const formData = new FormData()
  formData.append('titulo', form.titulo)
  formData.append('descricao', form.descricao)
  formData.append('categoria', form.categoria)
  if (form.link) formData.append('link', form.link)
  form.arquivos.forEach((f) => formData.append('arquivos', f))

  const res = await api.post<RespostaAPI>(`/respostas/${dossieId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// ── Avaliador ─────────────────────────────────────────────────────

export async function listarGruposDoAvaliador(): Promise<GrupoResumoPendentesAPI[]> {
  const res = await api.get<GrupoResumoPendentesAPI[]>('/respostas/meus-grupos')
  return res.data
}

export async function listarRespostasGrupo(grupoId: number): Promise<RespostaAPI[]> {
  const res = await api.get<RespostaAPI[]>(`/respostas/grupo/${grupoId}`)
  return res.data
}

export async function avaliarResposta(
  respostaId: number,
  dados: { tipo: string; comentario: string; categoria_nova?: string }
): Promise<RespostaAPI> {
  const res = await api.patch<RespostaAPI>(`/respostas/${respostaId}/avaliar`, dados)
  return res.data
}
