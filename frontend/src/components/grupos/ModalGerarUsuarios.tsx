import { motion } from 'framer-motion'
import { X, ChevronRight, AlertTriangle } from 'lucide-react'

interface Props {
  qtdUsuarios: string
  ultimaGeracao: Date | null
  onChange: (v: string) => void
  onContinuar: () => void
  onFechar: () => void
}

export default function ModalGerarUsuarios({ qtdUsuarios, ultimaGeracao, onChange, onContinuar, onFechar }: Props) {
  const inputClass = `w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground
    placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:border-primary/50 transition-colors`

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
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-sm
                        pointer-events-auto shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">Geração</p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                Gerar Usuários
              </h3>
            </div>
            <button onClick={onFechar}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Quantidade de Usuários
              </label>
              <input type="number" min="4" placeholder="Ex: 40"
                value={qtdUsuarios} onChange={e => onChange(e.target.value)}
                className={inputClass} />
              <span className="text-xs text-muted-foreground/50 font-mono">
                Mínimo 4. Grupos serão formados com 3 ou 4 membros.
              </span>
            </div>
            {ultimaGeracao && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-xs font-mono text-amber-400">
                  Isso irá substituir os grupos existentes.
                </span>
              </div>
            )}
            <button onClick={onContinuar}
              className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/40
                         hover:border-primary text-primary font-mono text-sm tracking-widest
                         rounded-lg transition-all uppercase">
              Continuar <ChevronRight size={16} className="inline ml-2" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}