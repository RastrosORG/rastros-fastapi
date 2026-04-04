import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Send, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Mensagem {
  id: number
  texto: string
  autor: string
  hora: string
  proprio: boolean
}

const mockMensagens: Mensagem[] = [
  { id: 1, texto: 'Operação iniciada. Aguardem instruções.', autor: 'Avaliador', hora: '09:00', proprio: false },
  { id: 2, texto: 'Entendido. Grupo pronto.', autor: 'Você', hora: '09:01', proprio: true },
  { id: 3, texto: 'Dossiê #01 já está disponível.', autor: 'Avaliador', hora: '09:03', proprio: false },
]

const MIN_W = 280
const MIN_H = 300
const MAX_W = 600
const MAX_H = Math.floor(window.innerHeight * 0.8)
const DEFAULT_W = 320
const DEFAULT_H = 420

export default function ChatWidget() {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>(mockMensagens)
  const [input, setInput] = useState('')
  const [chamouAvaliador, setChamouAvaliador] = useState(false)
  const [avaliadorAtendeu, setAvaliadorAtendeu] = useState(false)

  // Dimensões e posição do chat
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })

  // Drag de resize pelo canto superior esquerdo
  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H })

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (aberto) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, aberto])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = 20 * 4 + 20
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [input])

  // ── Resize handlers ───────────────────────────────────────────
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }

    function onMove(ev: MouseEvent) {
      if (!resizing.current) return
      // Arrastar para esquerda aumenta largura, arrastar para cima aumenta altura
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
  }, [size])

  // ── Chat helpers ──────────────────────────────────────────────
  function chamarAvaliador() {
    if (chamouAvaliador && !avaliadorAtendeu) return
    // TODO: WebSocket — emitir evento 'chamar_avaliador'
    setChamouAvaliador(true)
    setAvaliadorAtendeu(false)
  }

  // TODO: WebSocket — chamar quando avaliador entrar:
  // function onAvaliadorEntrou() { setAvaliadorAtendeu(true) }

  function enviar() {
    if (!input.trim()) return
    setMensagens(prev => [...prev, {
      id: Date.now(),
      texto: input.trim(),
      autor: 'Você',
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      proprio: true,
    }])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const podeChamar = !chamouAvaliador || avaliadorAtendeu

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
            {/* Alça de resize — canto superior esquerdo */}
            <div
              onMouseDown={onResizeMouseDown}
              className="absolute top-0 left-0 z-10 cursor-nw-resize"
              style={{ width: 24, height: 24 }}
              title="Redimensionar"
            >
              {/* Indicador visual sutil */}
              <svg width="14" height="14" viewBox="0 0 14 14"
                className="absolute top-1.5 left-1.5 opacity-30 hover:opacity-70 transition-opacity"
              >
                <line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
                <line x1="2" y1="7" x2="7" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground" />
              </svg>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar shrink-0">
              <div className="flex items-center gap-2 pl-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono tracking-widest text-foreground uppercase">
                  Chat — Grupo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={chamarAvaliador}
                  disabled={!podeChamar}
                  title={chamouAvaliador && !avaliadorAtendeu ? 'Aguardando o avaliador...' : 'Chamar avaliador'}
                  className={`flex items-center gap-1 px-2 py-0.5 border font-mono text-xs rounded
                             transition-all duration-300
                             ${chamouAvaliador && !avaliadorAtendeu
                               ? 'border-primary/50 bg-primary/15 text-primary cursor-not-allowed'
                               : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer'
                             }`}
                >
                  <Bell
                    size={11}
                    fill={chamouAvaliador && !avaliadorAtendeu ? 'currentColor' : 'none'}
                    className={chamouAvaliador && !avaliadorAtendeu ? 'animate-pulse' : ''}
                  />
                  {chamouAvaliador && !avaliadorAtendeu ? 'Chamado' : 'Chamar'}
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
              {mensagens.map((m) => (
                <div key={m.id} className={`flex flex-col gap-1 ${m.proprio ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words ${
                    m.proprio
                      ? 'bg-primary/20 text-foreground border border-primary/30'
                      : 'bg-secondary text-foreground border border-border'
                  }`}>
                    {m.texto}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {m.proprio ? '' : `${m.autor} · `}{m.hora}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 items-end shrink-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                rows={1}
                className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm
                           text-foreground placeholder:text-muted-foreground font-mono
                           focus:outline-none focus:border-primary/50 transition-colors
                           resize-none leading-5"
                style={{ minHeight: '36px', maxHeight: '100px' }}
              />
              <button onClick={enviar}
                className="p-2 bg-primary/10 hover:bg-primary/20 border border-primary/30
                           text-primary rounded-lg transition-all duration-200 shrink-0 self-end">
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
                   border border-primary/50"
        style={{ width: 52, height: 52 }}
      >
        <MessageSquare size={22} />
      </motion.button>
    </div>
  )
}