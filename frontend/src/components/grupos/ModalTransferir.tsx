import { motion } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import type { Grupo } from './GrupoCard'
import type { AvaliadorAPI } from '../../api/gruposApi'

interface Props {
  grupoId: string
  grupos: Grupo[]
  avaliadores: AvaliadorAPI[]
  onTransferir: (grupoId: string, avaliadorId: string) => void
  onFechar: () => void
}

export default function ModalTransferir({ grupoId, grupos, avaliadores, onTransferir, onFechar }: Props) {
  const avAtualId = grupos.find(g => g.id === grupoId)?.avaliadorId

  // Usa a lista completa de avaliadores do sistema, excluindo apenas o dono atual do grupo.
  // Isso garante que avaliadores sem nenhum grupo também apareçam como opção.
  const opcoes = avaliadores
    .filter(a => a.id.toString() !== avAtualId)
    .map(a => ({ id: a.id.toString(), nome: a.login }))

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6
                        pointer-events-auto shadow-2xl flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm tracking-widest uppercase text-white">Transferir Grupo</h3>
            <button onClick={onFechar}
              className="p-1.5 rounded text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Escolha o avaliador que receberá este grupo:
          </p>
          <div className="flex flex-col gap-2">
            {opcoes.length === 0 ? (
              <p className="text-muted-foreground/50 text-xs font-mono text-center py-4">
                Nenhum outro avaliador disponível.
              </p>
            ) : (
              opcoes.map(av => (
                <button key={av.id} onClick={() => onTransferir(grupoId, av.id)}
                  className="flex items-center justify-between px-4 py-3 border border-border
                             hover:border-primary/40 hover:bg-primary/5 rounded-lg transition-all group">
                  <span className="text-sm font-mono text-foreground">{av.nome}</span>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
