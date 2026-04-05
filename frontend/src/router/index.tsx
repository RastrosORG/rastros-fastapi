import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Dossies from '../pages/Dossies'
import Layout from '../components/layout/Layout'
import Respostas from '../pages/Respostas'
import GerenciarGrupos from '../pages/GerenciarGrupos'
import AvaliarRespostas from '../pages/AvaliarRespostas'
import Grupo from '../pages/Grupo'
import Pontuacao from '../pages/Pontuacao'
import ChatAvaliador from '../pages/ChatAvaliador'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: '/pontuacao',
        element: <Pontuacao />,
      },
      {
        path: '/grupo',
        element: <Grupo />,
      },
      {
        path: '/respostas',
        element: <Respostas />,
      },
      {
        path: '/home',
        element: <Home />,
      },
      {
        path: '/dossies',
        element: <Dossies />,
      },
      {
        path: '/grupos',         
        element: <GerenciarGrupos />,
      },
      {
        path: '/avaliar',
        element: <AvaliarRespostas />,
      },
      {
        path: '/chat',
        element: <ChatAvaliador />,
      },
    ],
  },
])