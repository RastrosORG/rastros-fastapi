import { api } from '../lib/axios'

export interface CronometroEstado {
  ativo: boolean
  duracao_segundos: number
  segundos_restantes: number
  pausado: boolean
  encerrado: boolean
}

export async function obterEstado(): Promise<CronometroEstado> {
  const res = await api.get<CronometroEstado>('/cronometro/estado')
  return res.data
}

export async function iniciarCronometro(duracaoSegundos: number): Promise<CronometroEstado> {
  const res = await api.post<CronometroEstado>('/cronometro/iniciar', {
    duracao_segundos: duracaoSegundos,
  })
  return res.data
}

export async function pausarCronometro(): Promise<CronometroEstado> {
  const res = await api.post<CronometroEstado>('/cronometro/pausar')
  return res.data
}

export async function retomarCronometro(): Promise<CronometroEstado> {
  const res = await api.post<CronometroEstado>('/cronometro/retomar')
  return res.data
}

export async function incrementarCronometro(segundos: number): Promise<CronometroEstado> {
  const res = await api.post<CronometroEstado>('/cronometro/incrementar', { segundos })
  return res.data
}

export async function adquirirLock(): Promise<{ sucesso: boolean }> {
  const res = await api.post<{ sucesso: boolean }>('/cronometro/lock')
  return res.data
}

export async function liberarLock(): Promise<{ sucesso: boolean }> {
  const res = await api.delete<{ sucesso: boolean }>('/cronometro/lock')
  return res.data
}

export async function obterEstadoLock(): Promise<{ bloqueado: boolean; avaliador_id: number | null }> {
  const res = await api.get<{ bloqueado: boolean; avaliador_id: number | null }>('/cronometro/lock')
  return res.data
}
