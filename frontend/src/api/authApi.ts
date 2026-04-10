import { api } from '../lib/axios'

export interface LoginResponse {
  access_token: string
  token_type: string
  is_avaliador: boolean
  usuario_id: number
  login: string
}

export async function loginApi(login: string, senha: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { login, senha })
  return response.data
}