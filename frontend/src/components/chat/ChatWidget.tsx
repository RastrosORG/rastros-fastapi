import { useState, useRef, useEffect, useMemo } from 'react'
import { MessageSquare, X, Send, Bell, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { meuGrupo } from '../../api/gruposApi'
import type { GrupoAPI } from '../../api/gruposApi'
import type { MensagemChat } from '../../api/chatApi'
import { useChatGrupo } from '../../hooks/useChat'
import { useAuthStore } from '../../store/authStore'
import { CORES_CHAT } from '../../lib/coresMembros'

type LocalEntry = { msg: MensagemChat; insertAfter: number }

const MIN_W = 280
const MIN_H = 300
const MAX_W = 600
const MAX_H = Math.floor(window.innerHeight * 0.8)
const DEFAULT_W = 320
const DEFAULT_H = 420

export default function ChatWidget() {
  const [aberto, setAberto] = useState(false)
  const [grupo, setGrupo] = useState<GrupoAPI | null>(null)
  const [input, setInput] = useState('')
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })

  const [locais, setLocais] = useState<LocalEntry[]>([])

  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: DEFAULT_W, h: DEFAULT_H })
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Evita envio duplo por clique rápido antes do re-render limpar o input
  const enviandoRef = useRef(false)
  // Guarda snapshot dos membros do turno anterior para detectar entradas/saídas
  const grupoAnteriorRef = useRef<GrupoAPI | null>(null)
  const localIdRef = useRef(-1)
  // Quantidade de mensagens reais no momento em que uma entrada local é criada
  const mensagensLenRef = useRef(0)
  // Nome do grupo destino quando o usuário foi realocado via WS (lido no effect de grupoId)
  const pendingRealocacaoRef = useRef<string | null>(null)

  const usuario = useAuthStore(s => s.usuario)
  const grupoId = grupo?.id ?? null

  const { mensagens, avaliadorPresente, chamouAvaliador, enviar, chamar, trocarGrupoId } = useChatGrupo(grupoId)

  // Fetch único no mount — inicializa grupoId para o WS conectar
  useEffect(() => {
    meuGrupo().then(setGrupo).catch(() => {})
  }, [])

  // Poll de membros só enquanto o chat está aberto — detecta entradas/saídas
  // e injeta mensagens de sistema. Quando fechado não há nada para exibir.
  useEffect(() => {
    if (!aberto) return
    function atualizar() {
      meuGrupo()
        .then(g => {
          setGrupo(prev => {
            if (!prev) return g
            const idMudou = prev.id !== g.id
            const nomeMudou = prev.nome_custom !== g.nome_custom || prev.nome !== g.nome
            const membrosMudaram =
              prev.membros.length !== g.membros.length ||
              prev.membros.some((m, i) => m.usuario.id !== g.membros[i]?.usuario.id ||
                m.usuario.nome_custom !== g.membros[i]?.usuario.nome_custom)
            if (idMudou || nomeMudou || membrosMudaram) return g
            return prev
          })
        })
        .catch(() => {})
    }
    atualizar() // atualiza ao abrir o chat
    const intervalo = setInterval(atualizar, 20000)
    return () => clearInterval(intervalo)
  }, [aberto])

  // Recebeu evento trocar_grupo via WS — salva o nome do grupo destino antes de trocar
  useEffect(() => {
    if (trocarGrupoId === null) return
    meuGrupo().then(g => {
      pendingRealocacaoRef.current = g.nome_custom || g.nome
      setGrupo(g)
    }).catch(() => {})
  }, [trocarGrupoId])

  // Sincroniza ref com a quantidade atual de mensagens reais
  useEffect(() => {
    mensagensLenRef.current = mensagens.length
  }, [mensagens])

  // Quando o grupo muda de id: limpa locais e injeta aviso de realocação se houver
  useEffect(() => {
    const nome = pendingRealocacaoRef.current
    pendingRealocacaoRef.current = null
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setTimeout(() => {
      setLocais(nome ? [{
        msg: { id: localIdRef.current--, texto: `Você foi realocado para o grupo ${nome}`, autor: '', hora, tipo: 'sistema', usuario_id: null },
        insertAfter: 0,
      }] : [])
    }, 0)
  }, [grupoId])

  // Detecta mudanças de membros no mesmo grupo e injeta avisos na posição correta
  useEffect(() => {
    const anterior = grupoAnteriorRef.current
    grupoAnteriorRef.current = grupo

    // Ignora se não há grupo ou se o grupo mudou de id (tratado no effect de grupoId)
    if (!grupo || !anterior || anterior.id !== grupo.id) return

    const idsAntes = new Set(anterior.membros.map(m => m.usuario.id))
    const idsAgora = new Set(grupo.membros.map(m => m.usuario.id))
    const novas: LocalEntry[] = []
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    // Captura a posição atual para que a mensagem fique entre as mensagens existentes
    // e as que chegarem depois
    const insertAfter = mensagensLenRef.current

    for (const m of anterior.membros) {
      if (!idsAgora.has(m.usuario.id)) {
        novas.push({
          msg: { id: localIdRef.current--, texto: `${m.usuario.nome_custom || m.usuario.login} saiu do grupo`, autor: '', hora, tipo: 'sistema', usuario_id: null },
          insertAfter,
        })
      }
    }
    for (const m of grupo.membros) {
      if (!idsAntes.has(m.usuario.id)) {
        novas.push({
          msg: { id: localIdRef.current--, texto: `${m.usuario.nome_custom || m.usuario.login} entrou no grupo`, autor: '', hora, tipo: 'sistema', usuario_id: null },
          insertAfter,
        })
      }
    }

    if (novas.length > 0) setTimeout(() => setLocais(prev => [...prev, ...novas]), 0)
  }, [grupo])

  // Mescla mensagens reais e locais mantendo a ordem cronológica correta
  const mensagensOrdenadas = useMemo(() => {
    const result: MensagemChat[] = []
    for (let i = 0; i <= mensagens.length; i++) {
      locais.filter(l => l.insertAfter === i).forEach(l => result.push(l.msg))
      if (i < mensagens.length) result.push(mensagens[i])
    }
    locais.filter(l => l.insertAfter === -1).forEach(l => result.push(l.msg))
    return result
  }, [mensagens, locais])

  useEffect(() => {
    if (aberto) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagensOrdenadas, aberto])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxH = 20 * 4 + 20
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px'
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
  }, [input])

  // Retorna a cor do membro pelo ID — imune a mudanças de nome
  function getCorMembro(usuarioId: number | null) {
    if (!grupo || !usuarioId) return CORES_CHAT[0]
    const idx = grupo.membros.findIndex(m => m.usuario.id === usuarioId)
    return CORES_CHAT[idx >= 0 ? idx % CORES_CHAT.length : 0]
  }

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
    const texto = input.trim()
    if (!texto || enviandoRef.current) return
    enviandoRef.current = true
    enviar(texto)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    requestAnimationFrame(() => { enviandoRef.current = false })
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
                  {chamouAvaliador && !avaliadorPresente ? 'Chamado' : 'Chamar avaliador'}
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
              {mensagensOrdenadas.map((m) => {
                const isAvaliador = m.tipo === 'avaliador'
                const isSistema = m.tipo === 'sistema'
                const proprio = m.tipo === 'grupo' && m.usuario_id === usuario?.id
                const cor = m.tipo === 'grupo' ? getCorMembro(m.usuario_id) : null

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
                  <div key={m.id} className={`flex flex-col gap-1 ${proprio ? 'items-end' : 'items-start'}`}>
                    {isAvaliador && (
                      <span className="text-xs font-mono text-primary ml-1 flex items-center gap-1">
                        <Shield size={10} /> Avaliador
                      </span>
                    )}
                    {!isAvaliador && !proprio && m.tipo === 'grupo' && (
                      <span className={`text-xs font-mono ml-1 ${cor?.autorCor ?? 'text-muted-foreground'}`}>
                        {m.autor}
                      </span>
                    )}
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words border ${
                      isAvaliador
                        ? 'bg-primary/15 border-primary/30 text-foreground'
                        : cor
                        ? `${cor.bubble} text-foreground`
                        : 'bg-secondary text-foreground border-border'
                    }`}>
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
