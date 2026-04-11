import { motion } from 'framer-motion'
import { X, Printer } from 'lucide-react'
import type { LogExclusaoUsuarioAPI } from '../../api/gruposApi'

interface Props {
  logs: LogExclusaoUsuarioAPI[]
  onFechar: () => void
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ModalLogExclusoesGrupos({ logs, onFechar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[85vh]
                   flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-mono text-sm tracking-widest uppercase text-foreground">
            Log de Exclusões — Usuários e Grupos
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground
                         hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                         rounded-lg transition-all uppercase">
              <Printer size={13} /> Imprimir
            </button>
            <button onClick={onFechar}
              className="text-muted-foreground hover:text-destructive transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-y-auto flex-1 px-6 py-4 print:px-0">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground font-mono text-sm tracking-widest uppercase">
              Nenhuma exclusão registrada
            </div>
          ) : (
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Tipo', 'Nome', 'Grupo', 'Excluído em', 'Avaliador', 'Motivo'].map(col => (
                    <th key={col} className="text-left py-2 pr-4 text-muted-foreground uppercase tracking-widest font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/40 hover:bg-white/2 transition-colors">
                    <td className="py-2.5 pr-4">
                      <span className={`px-1.5 py-0.5 rounded border text-xs
                        ${log.tipo === 'grupo'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-primary/30 bg-primary/10 text-primary'
                        }`}>
                        {log.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">{log.nome_usuario}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{log.grupo_nome || '—'}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {formatarData(log.excluido_em)}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{log.avaliador_nome}</td>
                    <td className="py-2.5 text-muted-foreground max-w-[200px] truncate" title={log.motivo}>
                      {log.motivo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {logs.length} registro{logs.length !== 1 ? 's' : ''}
          </span>
          <button onClick={onFechar}
            className="px-4 py-1.5 border border-border text-muted-foreground font-mono text-xs
                       tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
            Fechar
          </button>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body > *:not(.fixed) { display: none !important; }
          .fixed { position: static !important; background: white !important; }
        }
      `}</style>
    </div>
  )
}
