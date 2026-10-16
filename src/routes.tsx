import { createBrowserRouter } from 'react-router'

import { AppLayout } from './pages/_layouts/app'
import { AuthLayout } from './pages/_layouts/auth'
import { Bingos } from './pages/app/bingos'
import { Cards } from './pages/app/cards'
import { Home } from './pages/app/home'
import { SignIn } from './pages/auth/sign-in'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cards', element: <Cards /> },
      { path: 'bingos', element: <Bingos /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [{ path: 'sign-in', element: <SignIn /> }],
  },
])
