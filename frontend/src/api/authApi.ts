import { api } from '../lib/axios'

export interface LoginResponse {
  access_token: string
  token_type: string
  is_avaliador: boolean
  usuario_id: number
  login: string
  aceitou_termos: boolean
}

export async function loginApi(login: string, senha: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { login, senha })
  return response.data
}

export async function aceitarTermos(): Promise<void> {
  await api.post('/auth/aceitar-termos')
}

export async function cadastrarAvaliador(
  login: string,
  senha: string,
  email: string,
  chave_acesso: string,
): Promise<void> {
  await api.post('/auth/cadastro-avaliador', { login, senha, email, chave_acesso })
}