import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import type { Grupo } from './GrupoCard'

interface Props {
  grupos: Grupo[]
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalAdicionarUm({ grupos, onConfirmar, onCancelar }: Props) {
  const temGrupoDeTres = grupos.some(g => g.membros.length === 3)

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCancelar} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm p-6
                        pointer-events-auto shadow-2xl flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-primary" />
              <h3 className="font-mono text-sm tracking-widest uppercase text-white">Adicionar Usuário</h3>
            </div>
            <p className="text-muted-foreground text-sm font-mono leading-relaxed">
              {temGrupoDeTres
                ? 'Um novo usuário será adicionado ao primeiro grupo com 3 membros.'
                : 'Dois membros de grupos existentes formarão um novo grupo com o novo usuário.'
              }
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancelar}
              className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                         tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
              Cancelar
            </button>
            <button onClick={onConfirmar}
              className="px-4 py-2 border border-primary/40 bg-primary/10 text-primary
                         hover:bg-primary/20 font-mono text-xs tracking-widest rounded-lg transition-all uppercase">
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}