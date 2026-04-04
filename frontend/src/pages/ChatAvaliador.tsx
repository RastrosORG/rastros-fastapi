import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Bell } from 'lucide-react'

import ListaGruposChat, { type GrupoChat } from '../components/chat/ListaGruposChat'  // Lista lateral de grupos
import AreaChat, { type Mensagem } from '../components/chat/AreaChat'                  // Área do chat ativo

// ── Mock — substituído pelo authStore/WebSocket depois ──────────
const mockGrupos: GrupoChat[] = [
  { id: 'g1', nome: 'Grupo 01', chamouAvaliador: true, ultimaMensagem: 'Avaliador, pode nos ajudar?', ultimaHora: '14:32', naoLidas: 3 },
  { id: 'g2', nome: 'Grupo 02', chamouAvaliador: true, ultimaMensagem: 'Temos uma dúvida urgente', ultimaHora: '14:15', naoLidas: 1 },
  { id: 'g3', nome: 'Grupo 03', chamouAvaliador: false, ultimaMensagem: 'Obrigado!', ultimaHora: '13:40', naoLidas: 0 },
  { id: 'g4', nome: 'Grupo 04', chamouAvaliador: false, ultimaMensagem: '', ultimaHora: '', naoLidas: 0 },
  { id: 'g5', nome: 'Grupo 05', chamouAvaliador: false, ultimaMensagem: 'Entendido.', ultimaHora: '11:20', naoLidas: 0 },
]

const mockMensagens: Record<string, Mensagem[]> = {
  g1: [
    { id: 1, texto: 'Olá, temos uma dúvida sobre o dossiê #01.', autor: 'user01', hora: '14:20', tipo: 'grupo' },
    { id: 2, texto: 'A informação que encontramos é válida para a categoria "Família"?', autor: 'user02', hora: '14:21', tipo: 'grupo' },
    { id: 3, texto: 'Avaliador, pode nos ajudar?', autor: 'user01', hora: '14:32', tipo: 'grupo' },
  ],
  g2: [
    { id: 1, texto: 'Temos uma dúvida urgente sobre a pontuação.', autor: 'user05', hora: '14:15', tipo: 'grupo' },
  ],
  g3: [
    { id: 1, texto: 'Conseguimos o arquivo que precisávamos.', autor: 'user09', hora: '13:38', tipo: 'grupo' },
    { id: 2, texto: 'Perfeito, pode enviar como resposta.', autor: 'Avaliador', hora: '13:39', tipo: 'avaliador' },
    { id: 3, texto: 'Obrigado!', autor: 'user09', hora: '13:40', tipo: 'grupo' },
  ],
  g4: [],
  g5: [
    { id: 1, texto: 'Entendido.', autor: 'user17', hora: '11:20', tipo: 'grupo' },
  ],
}

// ── Áudio de entrada (Web Audio API — zero dependência) ─────────
function tocarAlertaEntrada() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch (_) { /* silencia se browser bloquear */ }
}

export default function ChatAvaliador() {
  const [grupos, setGrupos] = useState<GrupoChat[]>(mockGrupos)
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Record<string, Mensagem[]>>(mockMensagens)
  const [avaliadorEntrou, setAvaliadorEntrou] = useState<Record<string, boolean>>({})

  // TODO: WebSocket — substituir por conexão real
  const totalChamadas = grupos.filter(g => g.chamouAvaliador).length

  function selecionarGrupo(id: string) {
    setGrupoSelecionado(id)
    // Zera nao lidas ao abrir
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, naoLidas: 0 } : g))
  }

  const entrarNoChat = useCallback((grupoId: string) => {
    // TODO: WebSocket — emitir evento 'avaliador_entrou' para o grupo
    setAvaliadorEntrou(prev => ({ ...prev, [grupoId]: true }))
    setGrupos(prev => prev.map(g => g.id === grupoId ? { ...g, chamouAvaliador: false } : g))

    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const msgEntrada: Mensagem = {
      id: Date.now(),
      texto: 'O avaliador entrou no chat.',
      autor: 'sistema',
      hora,
      tipo: 'sistema',
    }
    setMensagens(prev => ({ ...prev, [grupoId]: [...(prev[grupoId] ?? []), msgEntrada] }))

    // Alerta sonoro — o grupo receberia isso via WebSocket
    tocarAlertaEntrada()
  }, [])

  function enviarMensagem(grupoId: string, texto: string) {
    // TODO: WebSocket — emitir mensagem para o grupo em tempo real
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const nova: Mensagem = { id: Date.now(), texto, autor: 'Avaliador', hora, tipo: 'avaliador' }
    setMensagens(prev => ({ ...prev, [grupoId]: [...(prev[grupoId] ?? []), nova] }))
    setGrupos(prev => prev.map(g => g.id === grupoId
      ? { ...g, ultimaMensagem: texto, ultimaHora: hora }
      : g
    ))
  }

  const grupoAtivo = grupoSelecionado ? grupos.find(g => g.id === grupoSelecionado) : null

  return (
    <div className="relative min-h-full" style={{
      backgroundColor: '#0d0d0f',
      backgroundImage: `
        linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}>
      <div className="flex h-screen overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col bg-card/30 overflow-hidden">
          <div className="p-4 border-b border-border shrink-0">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-1">Comunicação</p>
            <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>
              Chat dos Grupos
            </h1>
            {totalChamadas > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Bell size={12} className="text-amber-400 animate-pulse" />
                <p className="text-xs font-mono text-amber-400">
                  {totalChamadas} grupo{totalChamadas !== 1 ? 's' : ''} aguardando
                </p>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ListaGruposChat
              grupos={grupos}
              grupoSelecionado={grupoSelecionado}
              onSelecionar={selecionarGrupo}
            />
          </div>
        </div>

        {/* ── Área principal ────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          {!grupoSelecionado ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground"
            >
              <div className="p-5 bg-card border border-border rounded-full">
                <MessageSquare size={28} className="opacity-30" />
              </div>
              <p className="font-mono text-sm tracking-widest uppercase">Selecione um grupo</p>
              {totalChamadas > 0 && (
                <p className="text-xs font-mono text-amber-400/70">
                  {totalChamadas} grupo{totalChamadas !== 1 ? 's' : ''} esperando resposta
                </p>
              )}
            </motion.div>
          ) : (
            <AreaChat
              grupoNome={grupoAtivo?.nome ?? ''}
              mensagens={mensagens[grupoSelecionado] ?? []}
              avaliadorEntrou={avaliadorEntrou[grupoSelecionado] ?? false}
              onEnviar={texto => enviarMensagem(grupoSelecionado, texto)}
              onEntrar={() => entrarNoChat(grupoSelecionado)}
            />
          )}
        </div>
      </div>
    </div>
  )
}