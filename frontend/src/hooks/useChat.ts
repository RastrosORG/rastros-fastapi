import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import type { MensagemChat } from '../api/chatApi'

const WS_BASE = 'ws://localhost:8000/chat'
const BACKOFF_MAX = 30_000   // teto de 30s entre tentativas
const BACKOFF_FATOR = 2      // duplica a cada falha

// Som ascendente — avaliador entrou
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

// Som descendente — avaliador saiu
function tocarAlertaSaida() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (_) { /* silencia se browser bloquear */ }
}

// ── Hook para usuários comuns (ChatWidget) ────────────────────────────

export function useChatGrupo(grupoId: number | null) {
  const token = useAuthStore(s => s.token)
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
  const [avaliadorPresente, setAvaliadorPresente] = useState(false)
  const [chamouAvaliador, setChamouAvaliador] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  // Refs para controlar reconexão sem causar re-renders
  const destroyedRef = useRef(false)
  const retryDelayRef = useRef(1000)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const conectar = useCallback(() => {
    if (destroyedRef.current || !grupoId || !token) return

    const ws = new WebSocket(`${WS_BASE}/ws/grupo/${grupoId}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      retryDelayRef.current = 1000 // reset backoff após conexão bem-sucedida
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.evento === 'historico') {
        setMensagens(msg.dados)
        setAvaliadorPresente(msg.avaliador_presente)
        setChamouAvaliador(msg.chamou_avaliador)
      } else if (msg.evento === 'mensagem') {
        setMensagens(prev => [...prev, msg.dados])
      } else if (msg.evento === 'avaliador_entrou') {
        setAvaliadorPresente(true)
        setChamouAvaliador(false)
        setMensagens(prev => [...prev, msg.dados])
        tocarAlertaEntrada()
      } else if (msg.evento === 'avaliador_saiu') {
        setAvaliadorPresente(false)
        setMensagens(prev => [...prev, msg.dados])
        tocarAlertaSaida()
      }
      // 'ping' ignorado intencionalmente
    }

    ws.onclose = (e) => {
      // Código 4001 = token inválido — não tenta reconectar
      if (destroyedRef.current || e.code === 4001) return
      retryTimerRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * BACKOFF_FATOR, BACKOFF_MAX)
        conectar()
      }, retryDelayRef.current)
    }
  }, [grupoId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!grupoId || !token) return
    destroyedRef.current = false
    retryDelayRef.current = 1000
    conectar()

    return () => {
      destroyedRef.current = true
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      wsRef.current?.close()
    }
  }, [grupoId, token, conectar])

  const enviar = useCallback((texto: string) => {
    wsRef.current?.send(JSON.stringify({ texto }))
  }, [])

  const chamar = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ acao: 'chamar' }))
    setChamouAvaliador(true)
  }, [])

  return { mensagens, avaliadorPresente, chamouAvaliador, enviar, chamar }
}

// ── Hook para o avaliador monitorar um grupo ─────────────────────────

export function useChatGrupoAvaliador(grupoId: number | null) {
  const token = useAuthStore(s => s.token)
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
  const [avaliadorEntrou, setAvaliadorEntrou] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const destroyedRef = useRef(false)
  const retryDelayRef = useRef(1000)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const conectar = useCallback(() => {
    if (destroyedRef.current || !grupoId || !token) return

    const ws = new WebSocket(`${WS_BASE}/ws/grupo/${grupoId}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
      retryDelayRef.current = 1000
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)

      if (msg.evento === 'historico') {
        setMensagens(msg.dados)
        setAvaliadorEntrou(msg.avaliador_presente)
      } else if (msg.evento === 'mensagem') {
        setMensagens(prev => [...prev, msg.dados])
      } else if (msg.evento === 'avaliador_entrou') {
        setAvaliadorEntrou(true)
        setMensagens(prev => [...prev, msg.dados])
      } else if (msg.evento === 'avaliador_saiu') {
        setAvaliadorEntrou(false)
        setMensagens(prev => [...prev, msg.dados])
      }
      // 'ping' ignorado intencionalmente
    }

    ws.onclose = (e) => {
      if (destroyedRef.current || e.code === 4001) return
      retryTimerRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * BACKOFF_FATOR, BACKOFF_MAX)
        conectar()
      }, retryDelayRef.current)
    }
  }, [grupoId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!grupoId || !token) return
    destroyedRef.current = false
    retryDelayRef.current = 1000
    setMensagens([])
    setAvaliadorEntrou(false)
    conectar()

    return () => {
      destroyedRef.current = true
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      wsRef.current?.close()
    }
  }, [grupoId, token, conectar])

  const enviar = useCallback((texto: string) => {
    wsRef.current?.send(JSON.stringify({ texto }))
  }, [])

  const entrar = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ acao: 'entrar' }))
  }, [])

  const sair = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ acao: 'sair' }))
  }, [])

  return { mensagens, avaliadorEntrou, enviar, entrar, sair }
}

// ── Hook para o avaliador receber notificações de chamadas ────────────

export function useChatNotificacoes(
  onChamada: (grupoId: number, nome: string) => void
) {
  const token = useAuthStore(s => s.token)
  const onChamadaRef = useRef(onChamada)
  onChamadaRef.current = onChamada

  const destroyedRef = useRef(false)
  const retryDelayRef = useRef(1000)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const conectar = useCallback(() => {
    if (destroyedRef.current || !token) return

    const ws = new WebSocket(`${WS_BASE}/ws/avaliador?token=${token}`)

    ws.onopen = () => {
      retryDelayRef.current = 1000
    }

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.evento === 'chamada') {
        onChamadaRef.current(msg.grupo_id, msg.grupo_nome)
      }
      // 'ping' ignorado intencionalmente
    }

    ws.onclose = (e) => {
      if (destroyedRef.current || e.code === 4001) return
      retryTimerRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(retryDelayRef.current * BACKOFF_FATOR, BACKOFF_MAX)
        conectar()
      }, retryDelayRef.current)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return
    destroyedRef.current = false
    retryDelayRef.current = 1000
    conectar()

    return () => {
      destroyedRef.current = true
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [token, conectar])
}
