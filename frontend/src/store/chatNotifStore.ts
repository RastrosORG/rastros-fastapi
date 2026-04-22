import { create } from 'zustand'

interface ChatNotifState {
  pendingCount: number
  increment: () => void
  clear: () => void
}

export const useChatNotifStore = create<ChatNotifState>((set) => ({
  pendingCount: 0,
  increment: () => set(s => ({ pendingCount: s.pendingCount + 1 })),
  clear: () => set({ pendingCount: 0 }),
}))
