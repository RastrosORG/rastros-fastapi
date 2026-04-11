import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Printer, Trash2, ClipboardList } from 'lucide-react'
import type { LogExclusaoAPI } from '../../api/dossiesApi'

interface Props {
  logs: LogExclusaoAPI[]
  onFechar: () => void
}

function formatar(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ModalLogExclusoes({ logs, onFechar }: Props) {
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'print-log-exclusoes'
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        #log-exclusoes-print, #log-exclusoes-print * { visibility: visible; }
        #log-exclusoes-print {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          max-height: none !important;
          overflow: visible !important;
          background: white;
          color: black;
          padding: 32px;
          font-family: monospace;
        }
        #log-exclusoes-print .print-titulo {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 24px;
          border-bottom: 2px solid black;
          padding-bottom: 8px;
        }
        #log-exclusoes-print .print-linha {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          padding: 6px 0;
          border-bottom: 1px solid #eee;
          font-size: 11px;
          gap: 8px;
        }
        #log-exclusoes-print .print-header {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.08em;
          border-bottom: 2px solid #ccc;
          padding-bottom: 4px;
          margin-bottom: 4px;
        }
        #log-exclusoes-print .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
    return () => document.getElementById('print-log-exclusoes')?.remove()
  }, [])

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
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-border rounded-2xl w-full max-w-3xl max-h-[80vh]
                        shadow-2xl flex flex-col pointer-events-auto">

          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <ClipboardList size={16} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-mono text-sm tracking-widest uppercase text-white">
                  Log de Exclusões
                </h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {logs.length} dossiê{logs.length !== 1 ? 's' : ''} excluído{logs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 no-print">
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border
                           text-muted-foreground hover:text-foreground hover:border-primary/40
                           font-mono text-xs tracking-widest rounded-lg transition-all uppercase">
                <Printer size={12} /> Imprimir
              </button>
              <button onClick={onFechar}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div id="log-exclusoes-print" className="flex-1 overflow-y-auto p-6">
            <div className="print-titulo hidden">Log de Exclusões de Dossiês — Rastros 4.0</div>

            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Trash2 size={28} className="opacity-20" />
                <p className="font-mono text-xs tracking-widest uppercase">Nenhuma exclusão registrada</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0">
                {/* Cabeçalho da tabela */}
                <div className="print-header grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-3 py-2
                                text-xs font-mono text-muted-foreground tracking-widest uppercase
                                border-b border-border">
                  <span>Dossiê</span>
                  <span>Excluído em</span>
                  <span>Avaliador</span>
                  <span>Motivo</span>
                </div>

                {logs.map((log, i) => (
                  <div key={log.id}
                    className={`print-linha grid grid-cols-[2fr_1fr_1fr_2fr] gap-4 px-3 py-3
                                text-xs font-mono border-b border-border/50 transition-colors
                                hover:bg-card/30
                                ${i % 2 === 0 ? '' : 'bg-card/10'}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground font-medium">{log.nome_dossie}</span>
                      <span className="text-muted-foreground/60 text-[10px]">
                        Criado: {formatar(log.criado_em)}
                      </span>
                    </div>
                    <span className="text-muted-foreground self-center">{formatar(log.excluido_em)}</span>
                    <span className="text-primary self-center">{log.avaliador_nome}</span>
                    <span className="text-muted-foreground self-center leading-relaxed">{log.motivo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}
