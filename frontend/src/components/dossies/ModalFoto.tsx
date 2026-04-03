import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface Props {
  nome: string
  foto: string
  onFechar: () => void
}

export default function ModalFoto({ nome, foto, onFechar }: Props) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl overflow-hidden
                        pointer-events-auto shadow-2xl max-w-sm w-full">
          <div className="flex items-center justify-between px-5 py-3 border-b border-primary/20 bg-black/40">
            <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">{nome}</p>
            <button onClick={onFechar}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={16} />
            </button>
          </div>
          <img src={foto} alt={nome}
            className="w-full object-cover max-h-[60vh]" />
        </div>
      </motion.div>
    </>
  )
}