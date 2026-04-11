import { api } from '../lib/axios'

export interface GrupoChat {
  id: number
  nome: string
  chamou_avaliador: boolean
  avaliador_presente: boolean
  ultima_mensagem: string
  ultima_hora: string
}

export interface MensagemChat {
  id: number
  texto: string
  autor: string
  hora: string
  tipo: 'grupo' | 'avaliador' | 'sistema'
}

export async function listarGruposChat(): Promise<GrupoChat[]> {
  const { data } = await api.get<GrupoChat[]>('/chat/grupos')
  return data
}

export async function historico(grupoId: number): Promise<MensagemChat[]> {
  const { data } = await api.get<MensagemChat[]>(`/chat/grupos/${grupoId}/historico`)
  return data
}
