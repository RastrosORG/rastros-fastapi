import { Star, Clock, CheckCircle, XCircle, CheckCheck, Paperclip, MessageSquare } from 'lucide-react'

export type StatusResposta = 'pendente' | 'aprovada' | 'aprovada_parcial' | 'rejeitada'

export interface Resposta {
  id: number
  titulo: string
  descricao: string
  categoria: string
  link?: string
  arquivos: string[]
  dataEnvio: string
  status: StatusResposta
  dossieId: number
  dossieNome: string
  avaliacao?: {
    comentario: string
    categoriaOriginal?: string
    categoriaNova?: string
    pontos: number
  }
}

export const categorias = [
  { id: 'familia', label: 'Família', pontos: 10 },
  { id: 'info_basicas', label: 'Informações Básicas', pontos: 15 },
  { id: 'info_avancadas', label: 'Informações Avançadas', pontos: 30 },
  { id: 'dia_desaparecimento', label: 'Dia do Desaparecimento', pontos: 25 },
  { id: 'atividades_pos', label: 'Atividades Pós-Desaparecimento', pontos: 35 },
  { id: 'darkweb', label: 'Dark Web', pontos: 50 },
  { id: 'localizacao', label: 'Localização', pontos: 60 },
]

export const statusConfig = {
  pendente: { label: 'Pendente', icon: Clock, className: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  aprovada: { label: 'Aprovada', icon: CheckCircle, className: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
  aprovada_parcial: { label: 'Aprovada Parcialmente', icon: CheckCheck, className: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  rejeitada: { label: 'Rejeitada', icon: XCircle, className: 'text-destructive border-destructive/30 bg-destructive/10' },
}

interface Props {
  resposta: Resposta
  favoritada: boolean
  onAbrir: () => void
  onToggleFavorito: (e: React.MouseEvent) => void
}

export default function RespostaCard({ resposta: r, favoritada, onAbrir, onToggleFavorito }: Props) {
  const status = statusConfig[r.status]
  const StatusIcon = status.icon

  return (
    <button onClick={onAbrir}
      className="bg-card/70 backdrop-blur-sm border border-border hover:border-primary/40
                 rounded-xl px-5 py-4 flex items-center justify-between gap-4
                 transition-all duration-200 group text-left w-full"
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <span className="text-white text-sm font-semibold truncate group-hover:text-primary transition-colors">
          {r.titulo}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-primary/60">
            {categorias.find(c => c.id === r.categoria)?.label ?? r.categoria}
          </span>
          <span className="text-xs font-mono text-muted-foreground/50">·</span>
          <span className="text-xs font-mono text-muted-foreground/60">{r.dataEnvio}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {r.arquivos.length > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground/50">
            <Paperclip size={12} />
            <span className="text-xs font-mono">{r.arquivos.length}</span>
          </div>
        )}
        {r.avaliacao?.comentario && <MessageSquare size={13} className="text-primary/50" />}
        <button
          onClick={onToggleFavorito}
          className={`p-1 rounded transition-all ${favoritada ? 'text-primary' : 'text-muted-foreground/30 hover:text-primary/60'}`}
          title={favoritada ? 'Remover favorito' : 'Marcar como favorito'}
        >
          <Star size={14} fill={favoritada ? 'currentColor' : 'none'} />
        </button>
        <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1
                         rounded-full border ${status.className}`}>
          <StatusIcon size={11} />
          {status.label}
        </span>
      </div>
    </button>
  )
}