import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface Usuario {
  id: string
  login: string
  senha: string
  grupoId: string
}

interface Props {
  usuario: Usuario
  editando: boolean
}

export default function MembroCard({ usuario, editando }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: usuario.id, disabled: !editando })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all
        ${isDragging
          ? 'opacity-40 border-primary/60 bg-primary/10'
          : editando
            ? 'border-border bg-black/20 hover:border-primary/40 cursor-grab active:cursor-grabbing'
            : 'border-border bg-black/20 cursor-default'
        }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-xs font-mono text-primary">
            {usuario.login.replace('user', '')}
          </span>
        </div>
        <span className="text-sm font-mono text-foreground">{usuario.login}</span>
      </div>
      {editando && (
        <div className="flex items-center gap-1 text-muted-foreground/40">
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
          <div className="w-1 h-1 rounded-full bg-current" />
        </div>
      )}
    </div>
  )
}