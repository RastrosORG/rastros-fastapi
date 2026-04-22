import { motion } from 'framer-motion'
import { X, AlertTriangle, Users, Trash2 } from 'lucide-react'

interface GrupoPendente {
  id: string
  nome: string
  membros: { login: string }[]
}

interface UsuarioPendente {
  login: string
  grupoNome: string
}

interface Props {
  grupos: GrupoPendente[]
  usuarios: UsuarioPendente[]
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirmarConclusao({ grupos, usuarios, onConfirmar, onCancelar }: Props) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancelar} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-destructive/30 rounded-2xl w-full max-w-md p-6
                        pointer-events-auto shadow-2xl flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              <h3 className="font-mono text-sm tracking-widest uppercase text-white">Confirmar Exclusões</h3>
            </div>
            <button onClick={onCancelar}
              className="p-1.5 rounded text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </div>

          <p className="text-muted-foreground text-sm font-mono">
            As seguintes exclusões serão aplicadas permanentemente ao concluir:
          </p>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {grupos.map(g => (
              <div key={g.id} className="rounded-lg border border-destructive/20 bg-destructive/10 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Users size={13} className="text-destructive/70 flex-shrink-0" />
                  <span className="text-sm font-mono text-destructive/90 font-semibold">{g.nome}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    — {g.membros.length} membro{g.membros.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {g.membros.length > 0 && (
                  <div className="px-3 pb-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-destructive/15 pt-1.5">
                    {g.membros.map((m, i) => (
                      <span key={i} className="text-xs font-mono text-muted-foreground">{m.login}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {usuarios.map(u => (
              <div key={u.login}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <Trash2 size={12} className="text-destructive/60 flex-shrink-0" />
                <span className="text-sm font-mono text-destructive/80">{u.login}</span>
                <span className="text-xs font-mono text-muted-foreground">({u.grupoNome})</span>
              </div>
            ))}
          </div>

          <p className="text-xs font-mono text-destructive/70 bg-destructive/5 border border-destructive/20
                        rounded-lg px-3 py-2">
            Essa ação não pode ser desfeita.
          </p>

          <div className="flex gap-3">
            <button onClick={onCancelar}
              className="flex-1 px-4 py-2 border border-border text-muted-foreground hover:text-foreground
                         hover:border-primary/40 font-mono text-xs tracking-widest rounded-lg transition-all uppercase">
              Voltar
            </button>
            <button onClick={onConfirmar}
              className="flex-1 px-4 py-2 border border-destructive/50 bg-destructive/10 text-destructive
                         hover:bg-destructive/20 font-mono text-xs tracking-widest rounded-lg transition-all uppercase">
              Confirmar e Concluir
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
