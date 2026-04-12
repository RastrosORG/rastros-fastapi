import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Layout from '../components/layout/Layout'
import RotaProtegida from './RotaProtegida'
import Dossies from '../pages/Dossies'
import GerenciarGrupos from '../pages/GerenciarGrupos'
import AvaliarRespostas from '../pages/AvaliarRespostas'
import ChatAvaliador from '../pages/ChatAvaliador'
import Respostas from '../pages/Respostas'
import Grupo from '../pages/Grupo'
import Pontuacao from '../pages/Pontuacao'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    element: <RotaProtegida />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/home', element: <Home /> },
          { path: '/dossies', element: <Dossies /> },
          { path: '/pontuacao', element: <Pontuacao /> },
          { path: '/respostas', element: <Respostas /> },
          { path: '/grupo', element: <Grupo /> },
        ],
      },
      {
        element: <RotaProtegida apenasAvaliador />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: '/grupos', element: <GerenciarGrupos /> },
              { path: '/pontuacao', element: <Pontuacao /> },
              { path: '/avaliar', element: <AvaliarRespostas /> },
              { path: '/chat', element: <ChatAvaliador /> },
            ],
          },
        ],
      },
    ],
  },
])