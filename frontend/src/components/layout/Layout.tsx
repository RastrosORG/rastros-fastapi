import { useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatWidget from '../chat/ChatWidget'
import TimerBar from '../timer/TimerBar'
import { useAuthStore } from '../../store/authStore'
import type { AuthState } from '../../store/authStore'
import { useTimer } from '../../hooks/useTimer'
import { useChatNotificacoes } from '../../hooks/useChat'
import { useChatNotifStore } from '../../store/chatNotifStore'

// Montado apenas para avaliadores — mantém o WS de notificações ativo em qualquer página
function ChatNotifListener() {
  const increment = useChatNotifStore(s => s.increment)
  useChatNotificacoes(useCallback(() => increment(), [increment]))
  return null
}

export default function Layout() {
  const usuario = useAuthStore((state: AuthState) => state.usuario)
  const USER_ROLE = usuario?.is_avaliador ? 'avaliador' : 'user'

  // Inicializa o WebSocket do cronômetro para toda a aplicação
  useTimer()

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(201, 168, 76, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201, 168, 76, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TimerBar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      {USER_ROLE === 'user' && <ChatWidget />}
      {USER_ROLE === 'avaliador' && <ChatNotifListener />}
    </div>
  )
}