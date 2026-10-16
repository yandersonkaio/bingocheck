import { ArrowRight, History, Layers3, Plus, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function Home() {
  const { t } = useTranslation()

  // Temp values
  const totalCards = 0
  const activeBingos = 0

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('home.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('home.description')}
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <Layers3 className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-xs">
              {t('home.cards')}
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">{totalCards}</p>
          <p className="text-muted-foreground text-xs">{t('home.saved')}</p>
        </div>

        <div className="bg-card border-border rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <Ticket className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-xs">
              {t('home.bingos')}
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold">{activeBingos}</p>
          <p className="text-muted-foreground text-xs">
            {t('home.inProgress')}
          </p>
        </div>
      </div>

      {/* Empty state */}
      <section className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border px-5 py-10 text-center">
        <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
          <Ticket className="text-primary size-7" />
        </div>

        <div>
          <h2 className="text-lg font-semibold">{t('home.empty.title')}</h2>

          <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
            {t('home.empty.description')}
          </p>
        </div>

        <Link
          to="/bingos/new"
          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t('home.empty.createBingo')}
        </Link>
      </section>

      {/* Quick access */}
      <section className="bg-card border-border rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">{t('home.quickAccess.title')}</h2>

        <div className="flex flex-col">
          <Link
            to="/cards"
            className="hover:bg-accent flex items-center justify-between rounded-lg px-3 py-3 transition-colors"
          >
            <span className="flex items-center gap-3 text-sm">
              <Layers3 className="text-muted-foreground size-5" />
              {t('home.quickAccess.myCards')}
            </span>
            <ArrowRight className="text-muted-foreground size-4" />
          </Link>

          <Link
            to="/bingos"
            className="hover:bg-accent flex items-center justify-between rounded-lg px-3 py-3 transition-colors"
          >
            <span className="flex items-center gap-3 text-sm">
              <History className="text-muted-foreground size-5" />
              {t('home.quickAccess.bingoHistory')}
            </span>
            <ArrowRight className="text-muted-foreground size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
