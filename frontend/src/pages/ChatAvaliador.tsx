import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Bell, Loader2 } from 'lucide-react'

import ListaGruposChat, { type GrupoChat } from '../components/chat/ListaGruposChat'
import AreaChat from '../components/chat/AreaChat'
import { listarGruposChat } from '../api/chatApi'
import { useChatGrupoAvaliador, useChatNotificacoes } from '../hooks/useChat'

// Adapta GrupoChat (API) para o formato esperado por ListaGruposChat (string id)
function mapGrupo(g: { id: number; nome: string; chamou_avaliador: boolean; ultima_mensagem: string; ultima_hora: string }): GrupoChat {
  return {
    id: String(g.id),
    nome: g.nome,
    chamouAvaliador: g.chamou_avaliador,
    ultimaMensagem: g.ultima_mensagem,
    ultimaHora: g.ultima_hora,
    naoLidas: 0,
  }
}

export default function ChatAvaliador() {
  const [grupos, setGrupos] = useState<GrupoChat[]>([])
  const [carregando, setCarregando] = useState(true)
  const [grupoSelecionado, setGrupoSelecionado] = useState<string | null>(null)

  // Converte o id selecionado para number para o hook
  const grupoIdNum = grupoSelecionado ? parseInt(grupoSelecionado) : null
  const { mensagens, avaliadorEntrou, enviar, entrar, sair } = useChatGrupoAvaliador(grupoIdNum)

  // Carrega lista de grupos e re-verifica a cada 20s para detectar renomeações
  useEffect(() => {
    listarGruposChat()
      .then(dados => setGrupos(dados.map(mapGrupo)))
      .finally(() => setCarregando(false))

    const intervalo = setInterval(() => {
      listarGruposChat()
        .then(dados => {
          setGrupos(prev => {
            const novos = dados.map(mapGrupo)
            // Atualiza só o nome — preserva estado local de chamadas e naoLidas
            return novos.map(novo => {
              const anterior = prev.find(g => g.id === novo.id)
              if (!anterior) return novo
              return { ...anterior, nome: novo.nome }
            })
          })
        })
        .catch(() => {})
    }, 20000)

    return () => clearInterval(intervalo)
  }, [])

  // Recebe notificações de chamada via WS
  const handleChamada = useCallback((grupoId: number, nome: string) => {
    setGrupos(prev => {
      const existe = prev.find(g => g.id === String(grupoId))
      if (existe) {
        return prev.map(g => g.id === String(grupoId) ? { ...g, chamouAvaliador: true } : g)
      }
      // Grupo novo (improvável, mas seguro)
      return [...prev, { id: String(grupoId), nome, chamouAvaliador: true, ultimaMensagem: '', ultimaHora: '', naoLidas: 1 }]
    })
  }, [])

  useChatNotificacoes(handleChamada)

  function selecionarGrupo(id: string) {
    setGrupoSelecionado(id)
    // Zera badge de "chamou" ao abrir (avaliador viu)
    setGrupos(prev => prev.map(g => g.id === id ? { ...g, naoLidas: 0 } : g))
  }

  function handleEntrar() {
    entrar()
    setGrupos(prev => prev.map(g => g.id === grupoSelecionado ? { ...g, chamouAvaliador: false } : g))
  }

  function handleSair() {
    sair()
  }

  function handleEnviar(texto: string) {
    enviar(texto)
    // Atualiza última mensagem na lista
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setGrupos(prev => prev.map(g =>
      g.id === grupoSelecionado ? { ...g, ultimaMensagem: texto, ultimaHora: hora } : g
    ))
  }

  const totalChamadas = grupos.filter(g => g.chamouAvaliador).length
  const grupoAtivo = grupoSelecionado ? grupos.find(g => g.id === grupoSelecionado) : null

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-full" style={{ backgroundColor: '#0d0d0f' }}>
        <Loader2 size={28} className="animate-spin text-primary/60" />
      </div>
    )
  }

  return (
    <div className="relative h-full" style={{
      backgroundColor: '#0d0d0f',
      backgroundImage: `
        linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }}>
      <div className="flex h-full overflow-hidden">

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
              mensagens={mensagens}
              avaliadorEntrou={avaliadorEntrou}
              onEnviar={handleEnviar}
              onEntrar={handleEntrar}
              onSair={handleSair}
            />
          )}
        </div>
      </div>
    </div>
  )
}
