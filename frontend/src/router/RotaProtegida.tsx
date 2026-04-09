import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  apenasAvaliador?: boolean
}

export default function RotaProtegida({ apenasAvaliador = false }: Props) {
  const { token, usuario } = useAuthStore()

  if (!token) return <Navigate to="/" replace />

  if (apenasAvaliador && !usuario?.is_avaliador) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}