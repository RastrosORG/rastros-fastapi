import { api } from '../lib/axios'

export interface UsuarioNomeAPI {
  id: number
  login: string
  nome_custom: string | null
  nome_alterado: boolean
}

export async function atualizarNomeUsuario(nomeCustom: string): Promise<UsuarioNomeAPI> {
  const res = await api.patch<UsuarioNomeAPI>('/usuarios/nome', { nome_custom: nomeCustom })
  return res.data
}
