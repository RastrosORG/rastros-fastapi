import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { categorias, type Resposta } from './RespostaCard'

interface Props {
  resposta: Resposta
  onFechar: () => void
  onAvaliar: (id: number, resultado: {
    tipo: 'aprovada' | 'aprovada_parcial' | 'rejeitada'
    comentario: string
    categoriaNova?: string
  }) => void | Promise<void>
}

type TipoAvaliacao = 'aprovada' | 'aprovada_parcial' | 'rejeitada'

export default function ModalAvaliar({ resposta: r, onFechar, onAvaliar }: Props) {
  const [tipo, setTipo] = useState<TipoAvaliacao | null>(null)
  const [comentario, setComentario] = useState('')
  const [categoriaNova, setCategoriaNova] = useState('')
  const [avaliando, setAvaliando] = useState(false)

  const inputClass = `w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm
    text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none
    focus:border-primary/50 transition-colors`

  const pontosFinal = tipo === 'aprovada_parcial'
    ? categorias.find(c => c.id === categoriaNova)?.pontos ?? 0
    : tipo === 'aprovada'
      ? categorias.find(c => c.id === r.categoria)?.pontos ?? 0
      : 0

  async function confirmar() {
    if (!tipo || !comentario.trim()) return
    if (tipo === 'aprovada_parcial' && !categoriaNova) return
    setAvaliando(true)
    try {
      await onAvaliar(r.id, {
        tipo,
        comentario,
        categoriaNova: tipo === 'aprovada_parcial' ? categoriaNova : undefined,
      })
    } finally {
      setAvaliando(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={avaliando ? undefined : onFechar} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-2xl
                        max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-primary/20 bg-black/40 gap-4">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">{r.dossieNome}</p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                {r.titulo}
              </h3>
            </div>
            <button onClick={onFechar} disabled={avaliando}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all shrink-0
                         disabled:opacity-30 disabled:cursor-not-allowed">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6 bg-[#0f0f14]">

            {/* Conteúdo da resposta */}
            <div className="flex flex-col gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Categoria</p>
                  <span className="text-primary font-mono text-sm">
                    {categorias.find(c => c.id === r.categoria)?.label}
                    <span className="text-muted-foreground ml-2">
                      ({categorias.find(c => c.id === r.categoria)?.pontos}pts)
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Enviado em</p>
                  <span className="text-foreground font-mono text-sm">{r.dataEnvio}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Descrição</p>
                <p className="text-foreground/80 text-sm leading-relaxed">{r.descricao}</p>
              </div>
              {r.link && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Link</p>
                  <a href={r.link} target="_blank" rel="noopener noreferrer"
                    className="text-primary font-mono text-sm hover:underline truncate">{r.link}</a>
                </div>
              )}
              {r.arquivos.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Arquivos</p>
                  <div className="flex flex-wrap gap-2">
                    {r.arquivos.map(arq => (
                      <a key={arq.id} href={arq.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-black/30
                                   border border-white/10 hover:border-primary/30 rounded-lg
                                   text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
                        {arq.nome}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de avaliação */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Decisão</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'aprovada', label: 'Aceitar', icon: CheckCircle, cor: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' },
                  { key: 'aprovada_parcial', label: 'Aceitar c/ Alterações', icon: AlertTriangle, cor: 'border-orange-400/40 text-orange-400 hover:bg-orange-400/10' },
                  { key: 'rejeitada', label: 'Rejeitar', icon: XCircle, cor: 'border-destructive/40 text-destructive hover:bg-destructive/10' },
                ] as const).map(op => (
                  <button key={op.key} onClick={() => setTipo(op.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                      ${tipo === op.key
                        ? `${op.cor} bg-opacity-20 border-opacity-100`
                        : 'border-border text-muted-foreground hover:border-primary/30'
                      } ${tipo === op.key ? op.cor.replace('hover:', '') : ''}`}
                  >
                    <op.icon size={20} />
                    <span className="text-xs font-mono tracking-wide text-center">{op.label}</span>
                    {op.key !== 'rejeitada' && tipo === op.key && (
                      <span className="text-xs font-mono opacity-70">+{pontosFinal}pts</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria nova — só para aprovada parcial */}
            {tipo === 'aprovada_parcial' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                  Categoria Correta
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {categorias.filter(c => c.id !== r.categoria).map(cat => (
                    <button key={cat.id} onClick={() => setCategoriaNova(cat.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border
                                 text-xs font-mono transition-all
                                 ${categoriaNova === cat.id
                                   ? 'border-orange-400/50 bg-orange-400/10 text-orange-400'
                                   : 'border-border text-muted-foreground hover:border-orange-400/30'
                                 }`}>
                      <span>{cat.label}</span>
                      <span className="opacity-60">{cat.pontos}pts</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comentário */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Comentário <span className="text-primary">*</span>
              </label>
              <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                placeholder="Escreva um comentário para o grupo..."
                rows={3} className={`${inputClass} resize-none`} />
            </div>

            {/* Botão confirmar */}
            <button onClick={confirmar}
              disabled={avaliando || !tipo || !comentario.trim() || (tipo === 'aprovada_parcial' && !categoriaNova)}
              className={`w-full py-3 border font-mono text-sm tracking-widest rounded-lg
                          transition-all uppercase
                          ${tipo && comentario.trim() && !avaliando
                            ? tipo === 'aprovada'
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : tipo === 'aprovada_parcial'
                                ? 'border-orange-400/40 bg-orange-400/10 text-orange-400 hover:bg-orange-400/20'
                                : 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20'
                            : 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                          }`}>
              {avaliando ? 'Avaliando...' : !tipo ? 'Selecione uma decisão' : `Confirmar — ${
                tipo === 'aprovada' ? 'Aceitar' : tipo === 'aprovada_parcial' ? 'Aceitar com Alterações' : 'Rejeitar'
              }`}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}