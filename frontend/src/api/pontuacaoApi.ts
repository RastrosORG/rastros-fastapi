import api from './authApi'

export interface GrupoPontuacao {
  grupo_id: number
  nome: string
  pontos: number
  respostas: number
  aprovadas: number
  rejeitadas: number
  parciais: number
}

export interface IntervaloDados {
  rotulo: string
  dados: Record<string, number>
}

export interface RankingCompleto {
  ranking: GrupoPontuacao[]
  atividade: IntervaloDados[]
  evolucao: IntervaloDados[]
}

export async function listarRanking(): Promise<RankingCompleto> {
  const { data } = await api.get<RankingCompleto>('/pontuacao/ranking')
  return data
}
