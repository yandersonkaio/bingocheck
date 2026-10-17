import { createBrowserRouter } from 'react-router'

import { AppLayout } from './pages/_layouts/app'
import { AuthLayout } from './pages/_layouts/auth'
import { BingoDetails } from './pages/app/bingo-details'
import { Bingos } from './pages/app/bingos'
import { Cards } from './pages/app/cards'
import { EditCard } from './pages/app/edit-card'
import { Home } from './pages/app/home'
import { NewBingo } from './pages/app/new-bingo'
import { NewCard } from './pages/app/new-card'
import { NewRound } from './pages/app/new-round'
import { RoundDetails } from './pages/app/round-details'
import { SignIn } from './pages/auth/sign-in'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'cards', element: <Cards /> },
      { path: 'cards/new', element: <NewCard /> },
      { path: 'cards/:id/edit', element: <EditCard /> },
      { path: 'bingos', element: <Bingos /> },
      { path: 'bingos/new', element: <NewBingo /> },
      { path: 'bingos/:id', element: <BingoDetails /> },
      { path: 'bingos/:id/rounds/new', element: <NewRound /> },
      { path: 'bingos/:id/rounds/:roundId', element: <RoundDetails /> },
    ],
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [{ path: 'sign-in', element: <SignIn /> }],
  },
])
