import { Users } from 'lucide-react'

export interface GrupoResumo {
  id: string
  nome: string
  pendentes: number
  total: number
}

interface Props {
  grupos: GrupoResumo[]
  grupoSelecionado: string | null
  onSelecionar: (id: string) => void
}

export default function GrupoSeletor({ grupos, grupoSelecionado, onSelecionar }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {grupos.map(g => (
        <button key={g.id} onClick={() => onSelecionar(g.id)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border
                     text-left transition-all duration-200
                     ${grupoSelecionado === g.id
                       ? 'bg-primary/10 border-primary/50 text-primary'
                       : 'bg-card/50 border-border text-foreground hover:border-primary/30 hover:bg-card'
                     }`}
        >
          <div className="flex items-center gap-3">
            <Users size={15} className={grupoSelecionado === g.id ? 'text-primary' : 'text-muted-foreground'} />
            <span className="font-mono text-sm">{g.nome}</span>
          </div>
          <div className="flex items-center gap-2">
            {g.pendentes > 0 && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded-full
                               bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {g.pendentes}
              </span>
            )}
            <span className="text-xs font-mono text-muted-foreground">{g.total}</span>
          </div>
        </button>
      ))}
    </div>
  )
}