import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Usuario {
  id: number
  login: string
  is_avaliador: boolean
}

export interface AuthState {
  token: string | null
  usuario: Usuario | null
  setAuth: (token: string, usuario: Usuario) => void
  logout: () => void
  isAutenticado: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      setAuth: (token, usuario) => set({ token, usuario }),
      logout: () => set({ token: null, usuario: null }),
      isAutenticado: () => !!get().token,
    }),
    {
      name: 'rastros-auth',
    }
  )
)