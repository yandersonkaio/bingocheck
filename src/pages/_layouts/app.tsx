import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { Header } from '@/components/Header'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export function AppLayout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-8">
        <Outlet />
      </main>

      <footer className="flex flex-col items-center gap-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] text-center">
        <p className="text-muted-foreground text-xs">
          {t('common.developedBy')}{' '}
          <span className="text-foreground font-medium">Yanderson Kaio</span>
        </p>

        <p className="text-muted-foreground/70 text-[11px]">
          © {new Date().getFullYear()} BingoCheck
        </p>
      </footer>

      <BottomNavigation />
    </div>
  )
}
