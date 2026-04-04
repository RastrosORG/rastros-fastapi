import { MessageSquare, Bell } from 'lucide-react'

export interface GrupoChat {
  id: string
  nome: string
  chamouAvaliador: boolean
  ultimaMensagem?: string
  ultimaHora?: string
  naoLidas: number
}

interface Props {
  grupos: GrupoChat[]
  grupoSelecionado: string | null
  onSelecionar: (id: string) => void
}

export default function ListaGruposChat({ grupos, grupoSelecionado, onSelecionar }: Props) {
  const comChamada = grupos.filter(g => g.chamouAvaliador)
  const semChamada = grupos.filter(g => !g.chamouAvaliador)

  function GrupoItem({ g }: { g: GrupoChat }) {
    return (
      <button key={g.id} onClick={() => onSelecionar(g.id)}
        className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left
                   transition-all duration-200
                   ${grupoSelecionado === g.id
                     ? 'bg-primary/10 border-primary/50'
                     : g.chamouAvaliador
                       ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                       : 'bg-card/50 border-border hover:border-primary/30 hover:bg-card'
                   }`}>
        <div className="relative shrink-0 mt-0.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border
            ${grupoSelecionado === g.id
              ? 'bg-primary/20 border-primary/40'
              : g.chamouAvaliador
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-secondary border-border'
            }`}>
            <MessageSquare size={14} className={
              grupoSelecionado === g.id ? 'text-primary'
              : g.chamouAvaliador ? 'text-amber-400'
              : 'text-muted-foreground'
            } />
          </div>
          {g.chamouAvaliador && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-[#0d0d0f] animate-pulse" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-mono text-sm font-bold truncate
              ${grupoSelecionado === g.id ? 'text-primary'
              : g.chamouAvaliador ? 'text-amber-400'
              : 'text-foreground'}`}>
              {g.nome}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {g.ultimaHora && (
                <span className="text-xs font-mono text-muted-foreground/50">{g.ultimaHora}</span>
              )}
              {g.naoLidas > 0 && (
                <span className="text-xs font-mono px-1.5 py-0.5 rounded-full
                                 bg-primary/20 text-primary border border-primary/30">
                  {g.naoLidas}
                </span>
              )}
            </div>
          </div>
          {g.chamouAvaliador && (
            <div className="flex items-center gap-1.5">
              <Bell size={11} className="text-amber-400" />
              <span className="text-xs font-mono text-amber-400">Chamou o avaliador</span>
            </div>
          )}
          {!g.chamouAvaliador && g.ultimaMensagem && (
            <span className="text-xs font-mono text-muted-foreground/60 truncate">
              {g.ultimaMensagem}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {comChamada.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-mono text-amber-400/70 tracking-widest uppercase px-1 mb-1 flex items-center gap-1.5">
            <Bell size={11} /> Aguardando ({comChamada.length})
          </p>
          {comChamada.map(g => <GrupoItem key={g.id} g={g} />)}
        </div>
      )}
      {semChamada.length > 0 && (
        <div className="flex flex-col gap-1">
          {comChamada.length > 0 && (
            <p className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase px-1 mb-1">
              Demais grupos
            </p>
          )}
          {semChamada.map(g => <GrupoItem key={g.id} g={g} />)}
        </div>
      )}
    </div>
  )
}