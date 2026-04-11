import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { meuGrupo } from '../../api/gruposApi'
import { useChatGrupo } from '../../hooks/useChat'

const MIN_W = 280
const MIN_H = 300
const MAX_W = 600
const MAX_H = Math.floor(window.innerHeight * 0.8)
const DEFAULT_W = 320
const DEFAULT_H = 420

export default function ChatWidget() {
  const [aberto, setAberto] = useState(false)
  const [grupoId, setGrupoId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })

  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H })
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { mensagens, avaliadorPresente, chamouAvaliador, enviar, chamar } = useChatGrupo(grupoId)

  // Busca o grupo do usuário na montagem
  useEffect(() => {
    meuGrupo().then(g => setGrupoId(g.id)).catch(() => {})
  }, [])

  useEffect(() => {
    if (aberto) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, aberto])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxH = 20 * 4 + 20
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px'
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
  }, [input])

  // ── Resize ────────────────────────────────────────────────────────
  function onResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }

    function onMove(ev: MouseEvent) {
      if (!resizing.current) return
      const dw = resizeStart.current.x - ev.clientX
      const dh = resizeStart.current.y - ev.clientY
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, resizeStart.current.w + dw)),
        h: Math.min(MAX_H, Math.max(MIN_H, resizeStart.current.h + dh)),
      })
    }
    function onUp() {
      resizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ── Chat ─────────────────────────────────────────────────────────
  function handleEnviar() {
    if (!input.trim()) return
    enviar(input.trim())
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  const podeChamar = !chamouAvaliador || avaliadorPresente

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col relative"
            style={{ width: size.w, height: size.h }}
          >
            {/* Alça de resize */}
            <div
              onMouseDown={onResizeMouseDown}
              className="absolute top-0 left-0 z-10 cursor-nw-resize"
              style={{ width: 24, height: 24 }}
              title="Redimensionar"
            >
              <svg width="14" height="14" viewBox="0 0 14 14"
                className="absolute top-1.5 left-1.5 opacity-30 hover:opacity-70 transition-opacity">
                <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
                <line x1="2" y1="7" x2="7" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
              </svg>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar shrink-0">
              <div className="flex items-center gap-2 pl-3">
                <div className={`w-2 h-2 rounded-full ${grupoId ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/30'}`} />
                <span className="text-xs font-mono tracking-widest text-foreground uppercase">
                  Chat — Grupo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={chamar}
                  disabled={!podeChamar || !grupoId}
                  title={chamouAvaliador && !avaliadorPresente ? 'Aguardando o avaliador...' : 'Chamar avaliador'}
                  className={`flex items-center gap-1 px-2 py-0.5 border font-mono text-xs rounded
                             transition-all duration-300
                             ${chamouAvaliador && !avaliadorPresente
                               ? 'border-primary/50 bg-primary/15 text-primary cursor-not-allowed'
                               : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer'
                             } disabled:opacity-40`}
                >
                  <Bell
                    size={11}
                    fill={chamouAvaliador && !avaliadorPresente ? 'currentColor' : 'none'}
                    className={chamouAvaliador && !avaliadorPresente ? 'animate-pulse' : ''}
                  />
                  {chamouAvaliador && !avaliadorPresente ? 'Chamado' : 'Chamar'}
                </button>
                <button
                  onClick={() => setAberto(false)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
              {avaliadorPresente && (
                <div className="flex items-center gap-2 justify-center">
                  <div className="flex-1 h-px bg-primary/20" />
                  <span className="text-xs font-mono text-primary/60 px-2">Avaliador presente</span>
                  <div className="flex-1 h-px bg-primary/20" />
                </div>
              )}
              {mensagens.map((m) => {
                const proprio = m.tipo === 'grupo'  // mensagens do grupo = próprias para o usuário
                const isAvaliador = m.tipo === 'avaliador'
                const isSistema = m.tipo === 'sistema'

                if (isSistema) {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <span className="text-xs font-mono text-primary/60 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                        {m.texto}
                      </span>
                    </div>
                  )
                }

                return (
                  <div key={m.id} className={`flex flex-col gap-1 ${isAvaliador ? 'items-start' : 'items-end'}`}>
                    {isAvaliador && (
                      <span className="text-xs font-mono text-primary ml-1">Avaliador</span>
                    )}
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words ${
                      isAvaliador
                        ? 'bg-primary/15 border border-primary/30 text-foreground'
                        : 'bg-secondary text-foreground border border-border'
                    }`}>
                      {!isAvaliador && !proprio && (
                        <span className="block text-xs text-muted-foreground font-mono mb-1">{m.autor}</span>
                      )}
                      {m.texto}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{m.hora}</span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 items-end shrink-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={grupoId ? 'Digite uma mensagem...' : 'Sem grupo associado'}
                disabled={!grupoId}
                rows={1}
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm
                           text-foreground placeholder:text-muted-foreground font-mono
                           focus:outline-none focus:border-primary/50 transition-colors
                           resize-none leading-5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ minHeight: '36px', maxHeight: '100px' }}
              />
              <button onClick={handleEnviar} disabled={!grupoId || !input.trim()}
                className="p-2 bg-primary/10 hover:bg-primary/20 border border-primary/30
                           text-primary rounded-lg transition-all duration-200 shrink-0 self-end
                           disabled:opacity-40 disabled:cursor-not-allowed">
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAberto(v => !v)}
        className="bg-primary text-primary-foreground rounded-full shadow-lg
                   flex items-center justify-center hover:bg-primary/90 transition-all duration-200
                   border border-primary/50 relative"
        style={{ width: 52, height: 52 }}
      >
        <MessageSquare size={22} />
        {chamouAvaliador && !avaliadorPresente && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-background animate-pulse" />
        )}
      </motion.button>
    </div>
  )
}
