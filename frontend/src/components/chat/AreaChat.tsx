import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, LogIn, LogOut, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CORES_CHAT } from '../../lib/coresMembros'

export interface Mensagem {
  id: number
  texto: string
  autor: string
  hora: string
  tipo: 'grupo' | 'avaliador' | 'sistema'
  usuario_id: number | null
}

interface Props {
  grupoNome: string
  mensagens: Mensagem[]
  avaliadorEntrou: boolean
  onEnviar: (texto: string) => void
  onEntrar: () => void
  onSair: () => void
}

export default function AreaChat({ grupoNome, mensagens, avaliadorEntrou, onEnviar, onEntrar, onSair }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  // Mapeia por usuario_id — imune a mudanças de nome_custom
  const corPorUsuario = useMemo(() => {
    const mapa = new Map<number, number>()
    for (const m of mensagens) {
      if (m.tipo === 'grupo' && m.usuario_id !== null && !mapa.has(m.usuario_id)) {
        mapa.set(m.usuario_id, mapa.size)
      }
    }
    return mapa
  }, [mensagens])

  function getCorMembro(usuarioId: number | null) {
    if (usuarioId === null) return CORES_CHAT[0]
    const idx = corPorUsuario.get(usuarioId) ?? 0
    return CORES_CHAT[idx % CORES_CHAT.length]
  }

  function enviar() {
    if (!input.trim()) return
    onEnviar(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header do chat */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-card/20">
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {grupoNome}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {avaliadorEntrou ? (
              <span className="text-primary">Você está neste chat</span>
            ) : (
              'Clique em "Entrar no Chat" para participar'
            )}
          </p>
        </div>
        {avaliadorEntrou ? (
          <button onClick={onSair}
            className="flex items-center gap-2 px-4 py-2 bg-destructive/10 hover:bg-destructive/20
                       border border-destructive/40 hover:border-destructive text-destructive font-mono
                       text-xs tracking-widest rounded-lg transition-all uppercase">
            <LogOut size={14} /> Sair do Chat
          </button>
        ) : (
          <button onClick={onEntrar}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20
                       border border-primary/40 hover:border-primary text-primary font-mono
                       text-xs tracking-widest rounded-lg transition-all uppercase">
            <LogIn size={14} /> Entrar no Chat
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {mensagens.map(m => {
            const cor = m.tipo === 'grupo' ? getCorMembro(m.usuario_id) : null

            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${
                  m.tipo === 'sistema'
                    ? 'items-center'
                    : m.tipo === 'avaliador'
                    ? 'items-end'
                    : 'items-start'
                }`}
              >
                {/* Mensagem do sistema */}
                {m.tipo === 'sistema' && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20
                                  rounded-full text-xs font-mono text-primary/80 my-1">
                    <Shield size={11} />
                    {m.texto}
                  </div>
                )}

                {/* Mensagem do avaliador (direita) */}
                {m.tipo === 'avaliador' && (
                  <div className="flex flex-col items-end gap-1 max-w-[75%]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Shield size={11} className="text-primary" />
                      <span className="text-xs font-mono text-primary">Avaliador</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30
                                    text-sm text-foreground leading-relaxed">
                      {m.texto}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{m.hora}</span>
                  </div>
                )}

                {/* Mensagem do grupo (esquerda, cor do membro) */}
                {m.tipo === 'grupo' && cor && (
                  <div className="flex flex-col items-start gap-1 max-w-[75%]">
                    <span className={`text-xs font-mono ml-1 ${cor.autorCor}`}>{m.autor}</span>
                    <div className={`px-4 py-2.5 rounded-2xl rounded-tl-sm border
                                    text-sm text-foreground leading-relaxed ${cor.bubble}`}>
                      {m.texto}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono ml-1">{m.hora}</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t border-border shrink-0 transition-all
        ${!avaliadorEntrou ? 'opacity-50 pointer-events-none' : ''}`}>
        {!avaliadorEntrou && (
          <p className="text-xs font-mono text-muted-foreground text-center mb-2">
            Entre no chat para enviar mensagens
          </p>
        )}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Digite uma mensagem..."
            disabled={!avaliadorEntrou}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-sm
                       text-foreground placeholder:text-muted-foreground font-mono
                       focus:outline-none focus:border-primary/50 transition-colors
                       disabled:cursor-not-allowed"
          />
          <button onClick={enviar} disabled={!avaliadorEntrou || !input.trim()}
            className="p-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30
                       text-primary rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
