import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface Props {
  nomeDossie: string
  onFechar: () => void
  onConfirmar: (motivo: string) => Promise<void>
}

export default function ModalConfirmarExclusao({ nomeDossie, onFechar, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const LIMITE = 100
  const podeCofirmar = motivo.trim().length > 0 && !excluindo

  async function handleConfirmar() {
    if (!podeCofirmar) return
    setExcluindo(true)
    setErro(null)
    try {
      await onConfirmar(motivo.trim())
    } catch {
      setErro('Erro ao excluir. Tente novamente.')
      setExcluindo(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar}
        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-destructive/30 rounded-2xl w-full max-w-md p-6
                        shadow-2xl flex flex-col gap-5 pointer-events-auto">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle size={18} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-mono text-sm tracking-widest uppercase text-white">
                  Excluir Permanentemente
                </h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <button onClick={onFechar}
              className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          </div>

          {/* Aviso de consequências */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-sm font-mono text-destructive/80">
              O dossiê <span className="text-destructive font-bold">"{nomeDossie}"</span> será excluído junto com:
            </p>
            <ul className="text-xs font-mono text-muted-foreground space-y-1 mt-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-destructive/50 shrink-0" />
                Foto e todos os arquivos do dossiê (S3)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-destructive/50 shrink-0" />
                Todas as respostas enviadas pelos grupos
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-destructive/50 shrink-0" />
                Arquivos anexados às respostas (S3)
              </li>
            </ul>
          </div>

          {/* Campo de motivo */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
              Motivo da exclusão
            </label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value.slice(0, LIMITE))}
              placeholder="Descreva brevemente o motivo..."
              rows={3}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm
                         text-foreground placeholder:text-muted-foreground font-mono
                         focus:outline-none focus:border-destructive/50 transition-colors resize-none"
            />
            <div className="flex justify-between items-center">
              {erro && (
                <span className="text-xs font-mono text-destructive">{erro}</span>
              )}
              <span className={`text-xs font-mono ml-auto ${motivo.length >= LIMITE ? 'text-destructive' : 'text-muted-foreground'}`}>
                {motivo.length}/{LIMITE}
              </span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <button onClick={onFechar} disabled={excluindo}
              className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                         tracking-widest rounded-lg hover:bg-secondary transition-all uppercase
                         disabled:opacity-40 disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button onClick={handleConfirmar} disabled={!podeCofirmar}
              className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20
                         border border-destructive/40 hover:border-destructive text-destructive
                         font-mono text-xs tracking-widest rounded-lg transition-all uppercase
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {excluindo
                ? <span className="animate-pulse">Excluindo...</span>
                : <><Trash2 size={13} /> Excluir Definitivamente</>
              }
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
