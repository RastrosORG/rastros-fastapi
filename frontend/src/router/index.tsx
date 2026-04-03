import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Dossies from '../pages/Dossies'
import Layout from '../components/layout/Layout'
import Respostas from '../pages/Respostas'
import GerenciarGrupos from '../pages/GerenciarGrupos'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    element: <Layout />,
    children: [
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
    ],
  },
])