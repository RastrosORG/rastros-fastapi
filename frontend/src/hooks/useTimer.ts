import { useEffect, useRef } from 'react'
import { useTimerStore } from '../store/timerStore'
import { useAuthStore } from '../store/authStore'
import { obterEstado } from '../api/cronometroApi'
import type { CronometroEstado } from '../api/cronometroApi'

const WS_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000')
  .replace(/^https:/, 'wss:')
  .replace(/^http:/, 'ws:')

export function useTimer() {
  const token = useAuthStore((s) => s.token)
  const setEstado = useTimerStore((s) => s.setEstado)

  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  // Referência de tempo: timestamp local e segundos do servidor no momento da última sync
  const refTimestamp = useRef<number>(0)
  const refSegundos = useRef<number>(0)

  function pararContagem() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function iniciarContagem() {
    pararContagem()
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return
      const state = useTimerStore.getState()
      if (!state.ativo) {
        pararContagem()
        return
      }
      // Calcula restante a partir do timestamp de referência — sem drift
      const elapsed = Math.floor((Date.now() - refTimestamp.current) / 1000)
      const novo = Math.max(0, refSegundos.current - elapsed)
      if (novo <= 0) {
        setEstado({ segundosRestantes: 0, ativo: false, encerrado: true, pausado: false })
        pararContagem()
      } else {
        setEstado({ segundosRestantes: novo })
      }
    }, 500) // tick a cada 500ms para reagir rápido sem custo extra ao servidor
  }

  function sincronizarEstado(data: CronometroEstado) {
    // Grava referência de tempo antes de atualizar o estado
    if (data.ativo) {
      refTimestamp.current = Date.now()
      refSegundos.current = data.segundos_restantes
    }

    setEstado({
      ativo: data.ativo,
      duracaoSegundos: data.duracao_segundos,
      segundosRestantes: data.segundos_restantes,
      pausado: data.pausado,
      encerrado: data.encerrado,
      inicializado: true,
    })

    if (data.ativo) {
      iniciarContagem()
    } else {
      pararContagem()
    }
  }

  function conectarWS() {
    if (!token || !mountedRef.current) return

    const ws = new WebSocket(`${WS_BASE}/cronometro/ws?token=${token}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data) as CronometroEstado
        sincronizarEstado(data)
      } catch {
        // ignore parse errors
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (mountedRef.current && wsRef.current === ws) {
          conectarWS()
        }
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  useEffect(() => {
    mountedRef.current = true

    if (!token) return

    // Carrega estado inicial via REST (antes do WS conectar)
    obterEstado()
      .then((data) => {
        if (mountedRef.current) sincronizarEstado(data)
      })
      .catch(() => {})

    conectarWS()

    // Quando a aba volta ao foco, recalcula imediatamente a partir do servidor
    function handleVisibilidade() {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        const state = useTimerStore.getState()
        if (state.ativo) {
          // Atualiza referência para agora e recalcula sem esperar próximo tick
          const elapsed = Math.floor((Date.now() - refTimestamp.current) / 1000)
          const novo = Math.max(0, refSegundos.current - elapsed)
          if (novo <= 0) {
            setEstado({ segundosRestantes: 0, ativo: false, encerrado: true, pausado: false })
            pararContagem()
          } else {
            setEstado({ segundosRestantes: novo })
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilidade)

    return () => {
      mountedRef.current = false
      pararContagem()
      document.removeEventListener('visibilitychange', handleVisibilidade)
      if (wsRef.current) {
        const ws = wsRef.current
        wsRef.current = null
        ws.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
}
