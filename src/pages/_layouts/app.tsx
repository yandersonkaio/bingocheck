import { Outlet } from 'react-router'

import { Header } from '@/components/Header'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  )
}
