import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

interface Props {
  login: string
  grupoNome: string
  carregando: boolean
  onConfirmar: (motivo: string) => void
  onCancelar: () => void
}

export default function ModalConfirmarExclusaoUsuario({
  login, grupoNome, carregando, onConfirmar, onCancelar,
}: Props) {
  const [motivo, setMotivo] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22 }}
        className="bg-card border border-destructive/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="font-mono text-sm tracking-widest uppercase text-destructive">
              Excluir Usuário
            </h3>
          </div>
          <button onClick={onCancelar} disabled={carregando}
            className="text-muted-foreground hover:text-destructive transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-sm font-mono text-foreground">
              Você está prestes a excluir permanentemente o usuário{' '}
              <span className="text-destructive font-bold">{login}</span>
              {grupoNome && (
                <> do grupo <span className="text-primary">{grupoNome}</span></>
              )}.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Consequências:
            </p>
            <ul className="space-y-1.5">
              {[
                'O usuário perderá o acesso ao sistema imediatamente',
                'O registro será removido permanentemente do banco de dados',
                'Esta ação não pode ser desfeita',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-xs font-mono text-muted-foreground">
                  <span className="text-destructive mt-0.5">›</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Campo motivo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Motivo da exclusão <span className="text-destructive">*</span>
              </label>
              <span className={`text-xs font-mono ${motivo.length > 90 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {motivo.length}/100
              </span>
            </div>
            <input
              type="text"
              maxLength={100}
              placeholder="Descreva o motivo..."
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              disabled={carregando}
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm
                         text-foreground placeholder:text-muted-foreground font-mono
                         focus:outline-none focus:border-destructive/60 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onCancelar} disabled={carregando}
            className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                       tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(motivo)}
            disabled={!motivo.trim() || carregando}
            className={`px-4 py-2 border font-mono text-xs tracking-widest rounded-lg
                        transition-all uppercase
                        ${motivo.trim() && !carregando
                          ? 'border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                        }`}
          >
            {carregando ? 'Excluindo...' : 'Excluir Permanentemente'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
