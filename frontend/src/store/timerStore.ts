import { create } from 'zustand'

interface TimerState {
  ativo: boolean
  duracaoSegundos: number
  segundosRestantes: number
  pausado: boolean
  encerrado: boolean
  temLock: boolean
  inicializado: boolean
  setEstado: (estado: Partial<TimerState>) => void
}

export const useTimerStore = create<TimerState>((set) => ({
  ativo: false,
  duracaoSegundos: 0,
  segundosRestantes: 0,
  pausado: false,
  encerrado: false,
  temLock: false,
  inicializado: false,
  setEstado: (estado) => set(estado),
}))
