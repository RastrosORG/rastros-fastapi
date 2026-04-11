import { useEffect, useRef } from 'react'
import { useTimerStore } from '../store/timerStore'
import { useAuthStore } from '../store/authStore'
import { obterEstado } from '../api/cronometroApi'
import type { CronometroEstado } from '../api/cronometroApi'

const WS_BASE = 'ws://localhost:8000'

export function useTimer() {
  const token = useAuthStore((s) => s.token)
  const setEstado = useTimerStore((s) => s.setEstado)

  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  function pararContagem() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function iniciarContagem() {
    pararContagem()
    intervalRef.current = setInterval(() => {
      const state = useTimerStore.getState()
      if (!state.ativo) {
        pararContagem()
        return
      }
      const novo = state.segundosRestantes - 1
      if (novo <= 0) {
        setEstado({ segundosRestantes: 0, ativo: false, encerrado: true, pausado: false })
        pararContagem()
      } else {
        setEstado({ segundosRestantes: novo })
      }
    }, 1000)
  }

  function sincronizarEstado(data: CronometroEstado) {
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

    return () => {
      mountedRef.current = false
      pararContagem()
      if (wsRef.current) {
        const ws = wsRef.current
        wsRef.current = null
        ws.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
}
