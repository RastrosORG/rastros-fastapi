import { api } from '../lib/axios'

export interface GrupoAPI {
  id: number
  nome: string
  nome_custom: string | null
  nome_alterado: boolean
  avaliador_id: number
  avaliador_nome: string
  criado_em: string
  membros: {
    id: number
    usuario: {
      id: number
      login: string
      nome_custom: string | null
      nome_alterado: boolean
    }
  }[]
}

export interface CredencialAPI {
  id: number
  login: string
  senha: string
  grupo_id: number
  grupo_nome: string
}

interface GerarUsuariosOutput {
  grupos_criados: number
  usuarios_criados: number
  credenciais: CredencialAPI[]
}

export async function listarTodosGrupos(): Promise<GrupoAPI[]> {
  const res = await api.get<GrupoAPI[]>('/grupos/todos')
  return res.data
}

export async function gerarUsuarios(quantidade: number): Promise<GerarUsuariosOutput> {
  const res = await api.post<GerarUsuariosOutput>('/grupos/gerar', { quantidade })
  return res.data
}

export async function transferirGrupo(grupoId: number, avaliadorId: number): Promise<GrupoAPI> {
  const res = await api.patch<GrupoAPI>(`/grupos/${grupoId}/transferir/${avaliadorId}`)
  return res.data
}

export async function moverMembro(usuarioId: number, grupoId: number): Promise<GrupoAPI> {
  const res = await api.patch<GrupoAPI>(`/grupos/membro/${usuarioId}/mover/${grupoId}`)
  return res.data
}

export interface MovimentoMembro {
  usuario_id: number
  grupo_id: number
}

export async function reorganizarMembros(movimentos: MovimentoMembro[]): Promise<void> {
  await api.post('/grupos/reorganizar', { movimentos })
}

export interface LockStatus {
  bloqueado: boolean
  avaliador_id: number | null
  avaliador_nome: string | null
}

export async function adquirirLock(): Promise<void> {
  await api.post('/grupos/lock')
}

export async function liberarLock(): Promise<void> {
  await api.delete('/grupos/lock')
}

export async function statusLock(): Promise<LockStatus> {
  const res = await api.get<LockStatus>('/grupos/lock')
  return res.data
}

export async function adicionarMembro(): Promise<CredencialAPI> {
  const res = await api.post<{ credencial: CredencialAPI }>('/grupos/adicionar-membro')
  return res.data.credencial
}

export async function meuGrupo(): Promise<GrupoAPI> {
  const res = await api.get<GrupoAPI>('/grupos/meu')
  return res.data
}

export async function atualizarNomeGrupo(grupoId: number, nomeCustom: string): Promise<GrupoAPI> {
  const res = await api.patch<GrupoAPI>(`/grupos/${grupoId}/nome`, { nome_custom: nomeCustom })
  return res.data
}

export async function renomearGrupoAvaliador(grupoId: number, nomeCustom: string): Promise<GrupoAPI> {
  const res = await api.patch<GrupoAPI>(`/grupos/${grupoId}/renomear`, { nome_custom: nomeCustom })
  return res.data
}

export interface LogExclusaoUsuarioAPI {
  id: number
  tipo: string
  nome_usuario: string
  grupo_nome: string
  excluido_em: string
  avaliador_nome: string
  motivo: string
}

export async function excluirUsuario(usuarioId: number, motivo: string): Promise<void> {
  await api.delete(`/grupos/usuario/${usuarioId}`, { data: { motivo } })
}

export async function excluirGrupo(grupoId: number, motivo: string): Promise<void> {
  await api.delete(`/grupos/${grupoId}`, { data: { motivo } })
}

export async function listarLogExclusoesGrupos(): Promise<LogExclusaoUsuarioAPI[]> {
  const res = await api.get<LogExclusaoUsuarioAPI[]>('/grupos/log-exclusoes')
  return res.data
}

export interface ListarCredenciaisOutput {
  credenciais: CredencialAPI[]
  ultima_atualizacao: string | null
}

export async function listarCredenciais(): Promise<ListarCredenciaisOutput> {
  const res = await api.get<ListarCredenciaisOutput>('/grupos/credenciais')
  return res.data
}

export interface AvaliadorAPI {
  id: number
  login: string
}

export async function listarAvaliadores(): Promise<AvaliadorAPI[]> {
  const res = await api.get<AvaliadorAPI[]>('/usuarios/avaliadores')
  return res.data
}
