import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Minus } from 'lucide-react'
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

export default function ChatWidget() {
  const [aberto, setAberto] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>(mockMensagens)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (aberto && !minimizado) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, aberto, minimizado])

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
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Janela do chat */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: minimizado ? 'auto' : '420px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono tracking-widest text-foreground uppercase">
                  Chat — Avaliador
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimizado(v => !v)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Minus size={14} />
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
            {!minimizado && (
              <>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {mensagens.map((m) => (
                    <div key={m.id} className={`flex flex-col gap-1 ${m.proprio ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
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
                <div className="p-3 border-t border-border flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviar()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm 
                               text-foreground placeholder:text-muted-foreground font-mono
                               focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    onClick={enviar}
                    className="p-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 
                               text-primary rounded-lg transition-all duration-200"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setAberto(v => !v); setMinimizado(false) }}
        className="w-13 h-13 bg-primary text-primary-foreground rounded-full shadow-lg 
                   flex items-center justify-center hover:bg-primary/90 transition-all duration-200
                   border border-primary/50"
        style={{ width: 52, height: 52 }}
      >
        <MessageSquare size={22} />
      </motion.button>

    </div>
  )
}