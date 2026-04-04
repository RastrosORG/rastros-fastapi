import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CheckCircle, XCircle, AlertTriangle, MessageSquare, Pencil } from 'lucide-react'
import { categorias, statusConfig, type Resposta } from './RespostaCard'

interface Props {
  resposta: Resposta
  onFechar: () => void
  onCorrigir: (id: number, resultado: {
    tipo: 'aprovada' | 'aprovada_parcial' | 'rejeitada'
    comentario: string
    categoriaNova?: string
  }) => void
}

export default function ModalVerAvaliada({ resposta: r, onFechar, onCorrigir }: Props) {
  const [modoCorrecao, setModoCorrecao] = useState(false)
  const [tipo, setTipo] = useState<'aprovada' | 'aprovada_parcial' | 'rejeitada'>(r.status as never)
  const [comentario, setComentario] = useState(r.avaliacao?.comentario ?? '')
  const [categoriaNova, setCategoriaNova] = useState(r.avaliacao?.categoriaNova ?? r.categoria)

  const status = statusConfig[r.status]
  const StatusIcon = status.icon

  const inputClass = `w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm
    text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none
    focus:border-primary/50 transition-colors`

  function confirmarCorrecao() {
    if (!comentario.trim()) return
    onCorrigir(r.id, { tipo, comentario, categoriaNova: tipo === 'aprovada_parcial' ? categoriaNova : undefined })
    onFechar()
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onFechar} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="bg-[#13131a] border border-primary/20 rounded-2xl w-full max-w-2xl
                        max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">

          <div className="flex items-start justify-between px-6 py-4 border-b border-primary/20 bg-black/40 gap-4">
            <div>
              <p className="text-xs font-mono text-primary/70 tracking-widest uppercase">{r.dossieNome}</p>
              <h3 className="text-white font-bold text-lg mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                {r.titulo}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border ${status.className}`}>
                <StatusIcon size={11} /> {status.label}
              </span>
              {!modoCorrecao && (
                <button onClick={() => setModoCorrecao(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground
                             hover:text-foreground hover:border-primary/40 font-mono text-xs tracking-widest
                             rounded-lg transition-all uppercase">
                  <Pencil size={12} /> Corrigir
                </button>
              )}
              <button onClick={onFechar}
                className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5 bg-[#0f0f14]">

            {/* Conteúdo */}
            <div className="flex flex-col gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Categoria</p>
                <span className="text-primary font-mono text-sm">
                  {categorias.find(c => c.id === r.categoria)?.label}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-mono text-foreground/50 tracking-widest uppercase">Descrição</p>
                <p className="text-foreground/80 text-sm leading-relaxed">{r.descricao}</p>
              </div>
              {r.link && (
                <a href={r.link} target="_blank" rel="noopener noreferrer"
                  className="text-primary font-mono text-sm hover:underline truncate">{r.link}</a>
              )}
              {r.arquivos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {r.arquivos.map(arq => (
                    <span key={arq} className="px-2.5 py-1 bg-black/30 border border-white/10
                                               rounded-lg text-xs font-mono text-muted-foreground">
                      {arq}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Avaliação atual */}
            {r.avaliacao && !modoCorrecao && (
              <div className={`flex flex-col gap-3 p-4 rounded-xl border ${
                r.status === 'aprovada' ? 'bg-emerald-950/40 border-emerald-500/20'
                : r.status === 'aprovada_parcial' ? 'bg-orange-950/40 border-orange-400/20'
                : 'bg-destructive/10 border-destructive/20'
              }`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono tracking-widest uppercase flex items-center gap-2 text-muted-foreground">
                    <MessageSquare size={12} /> Avaliação
                  </p>
                  {r.avaliacao.pontos > 0 && (
                    <span className="text-xs font-mono text-primary border border-primary/30 rounded px-2 py-0.5">
                      +{r.avaliacao.pontos} pts
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{r.avaliacao.comentario}</p>
                {r.avaliacao.categoriaNova && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">Categoria corrigida:</span>
                    <span className="text-muted-foreground/50 line-through">
                      {categorias.find(c => c.id === r.avaliacao?.categoriaOriginal)?.label}
                    </span>
                    <span className="text-orange-400">→ {categorias.find(c => c.id === r.avaliacao?.categoriaNova)?.label}</span>
                  </div>
                )}
              </div>
            )}

            {/* Modo correção */}
            {modoCorrecao && (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Nova Decisão</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { key: 'aprovada' as const, label: 'Aceitar', icon: CheckCircle, cor: 'border-emerald-500/40 text-emerald-400' },
                      { key: 'aprovada_parcial' as const, label: 'Aceitar c/ Alt.', icon: AlertTriangle, cor: 'border-orange-400/40 text-orange-400' },
                      { key: 'rejeitada' as const, label: 'Rejeitar', icon: XCircle, cor: 'border-destructive/40 text-destructive' },
                    ]).map(op => (
                      <button key={op.key} onClick={() => setTipo(op.key)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                          ${tipo === op.key ? `${op.cor} bg-white/5` : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                        <op.icon size={18} />
                        <span className="text-xs font-mono text-center">{op.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {tipo === 'aprovada_parcial' && (
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
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                    Comentário <span className="text-primary">*</span>
                  </label>
                  <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                    rows={3} className={`${inputClass} resize-none`} />
                </div>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => setModoCorrecao(false)}
                    className="px-4 py-2 border border-border text-muted-foreground font-mono text-xs
                               tracking-widest rounded-lg hover:bg-secondary transition-all uppercase">
                    Cancelar
                  </button>
                  <button onClick={confirmarCorrecao} disabled={!comentario.trim()}
                    className={`px-4 py-2 border font-mono text-xs tracking-widest rounded-lg transition-all uppercase
                      ${comentario.trim()
                        ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary'
                        : 'border-border text-muted-foreground opacity-40 cursor-not-allowed'
                      }`}>
                    Salvar Correção
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}