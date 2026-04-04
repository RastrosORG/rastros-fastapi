import { motion } from 'framer-motion'
import { X, Printer, Shield } from 'lucide-react'
import type { Grupo } from './GrupoCard'

interface Props {
  grupos: Grupo[]
  onFechar: () => void
}

export default function ModalCredenciais({ grupos, onFechar }: Props) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-2xl
                        max-h-[85vh] flex flex-col pointer-events-auto shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Acesso Restrito</p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                Credenciais Geradas
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 border border-border text-muted-foreground
                           hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                           rounded-lg transition-all uppercase">
                <Printer size={14} /> Imprimir
              </button>
              <button onClick={onFechar}
                className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 bg-[#0f0f14]">
            {grupos.map(grupo => (
              <div key={grupo.id} className="border-b border-white/5 last:border-0">
                <div className="px-6 py-3 bg-black/20 flex items-center justify-between">
                  <span className="text-xs font-mono text-primary/70 tracking-widest uppercase">
                    {grupo.nome}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{grupo.avaliadorNome}</span>
                </div>
                <div className="px-6 py-3 grid grid-cols-2 gap-2">
                  {grupo.membros.map(m => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2
                                               bg-black/20 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield size={13} className="text-primary/60" />
                        <span className="font-mono text-sm text-foreground">{m.login}</span>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground tracking-widest">
                        {m.senha}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}