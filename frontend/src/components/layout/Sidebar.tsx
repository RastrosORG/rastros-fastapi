import { NavLink } from 'react-router-dom'
import { Home, Users, Trophy, FileText, MessageSquare, LogOut, User } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="flex flex-col items-center w-16 h-screen bg-sidebar border-r border-sidebar-border py-4 gap-2 shrink-0" 
        style={{ backgroundColor: 'var(--sidebar)' }}>

      {/* Logo */}
      <div className="mb-6 px-2">
        <img src="/favicon.ico" alt="Rastros" className="w-12 h-12 object-contain" />
      </div>

      {/* Nav principal */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {[
          { to: '/home', icon: Home, label: 'Home' },
          { to: '/grupo', icon: Users, label: 'Grupo' },
          { to: '/pontuacao', icon: Trophy, label: 'Pontuação' },
          { to: '/respostas', icon: FileText, label: 'Respostas' },
          { to: '/chat', icon: MessageSquare, label: 'Chat' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <Icon size={20} />
          </NavLink>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="flex flex-col items-center gap-1">
        <NavLink
          to="/perfil"
          title="Perfil"
          className={({ isActive }) =>
            `p-3 rounded-lg transition-all duration-200 ${
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'
            }`
          }
        >
          <User size={20} />
        </NavLink>
        <button
          title="Sair"
          className="p-3 rounded-lg text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut size={20} />
        </button>
      </div>

    </aside>
  )
}