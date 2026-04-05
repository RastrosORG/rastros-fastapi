import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatWidget from '../chat/ChatWidget'

// Mock — substituir pelo authStore depois
const USER_ROLE: 'user' | 'avaliador' = 'avaliador'

export default function Layout() {
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
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
      {USER_ROLE === 'user' && <ChatWidget />}
    </div>
  )
}