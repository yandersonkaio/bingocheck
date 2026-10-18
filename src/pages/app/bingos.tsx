import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarDays, ChevronRight, Grid3X3, Plus, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { db } from '@/lib/database'

export function Bingos() {
  const { t, i18n } = useTranslation()

  const bingos = useLiveQuery(async () => {
    const all = await db.bingos.orderBy('createdAt').reverse().toArray()

    return [
      ...all.filter((b) => b.status === 'in_progress'),
      ...all.filter((b) => b.status !== 'in_progress'),
    ]
  }, [])

  const existingCardIds = useLiveQuery(async () => {
    const cards = await db.cards.toArray()
    return new Set(cards.map((card) => card.id))
  }, [])

  const isLoading = bingos === undefined || existingCardIds === undefined

  function formatDate(date: string | null) {
    if (!date) {
      return t('bingos.noDate')
    }

    const [year, month, day] = date.split('-').map(Number)

    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('bingos.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {t('bingos.description')}
          </p>
        </div>

        <Link
          to="/bingos/new"
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          <span>{t('bingos.newBingo')}</span>
        </Link>
      </div>

      {isLoading && (
        <div className="text-muted-foreground py-10 text-center text-sm">
          {t('bingos.loading')}
        </div>
      )}

      {!isLoading && bingos.length === 0 && (
        <section className="bg-card border-border relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-5 py-12 text-center">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
          />

          <div className="bg-primary/10 ring-primary/20 relative flex size-16 items-center justify-center rounded-full ring-4">
            <Ticket className="text-primary size-7" />
          </div>

          <div className="relative">
            <h2 className="text-lg font-semibold">{t('bingos.empty.title')}</h2>

            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              {t('bingos.empty.description')}
            </p>
          </div>

          <Link
            to="/bingos/new"
            className="bg-primary text-primary-foreground relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('bingos.empty.createBingo')}
          </Link>
        </section>
      )}

      {!isLoading && bingos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {bingos.map((bingo) => {
            const validCardCount = bingo.cardIds.filter((cardId) =>
              existingCardIds.has(cardId),
            ).length

            return (
              <Link
                key={bingo.id}
                to={`/bingos/${bingo.id}`}
                className="group bg-card border-border hover:border-primary/50 relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4 transition-all hover:shadow-sm"
              >
                <div
                  aria-hidden
                  className="bg-primary/10 pointer-events-none absolute -top-8 -right-8 size-20 rounded-full blur-2xl"
                />

                <div className="relative flex items-start justify-between gap-3">
                  <h2 className="min-w-0 truncate text-base font-semibold">
                    {bingo.name}
                  </h2>

                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      bingo.status === 'in_progress'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        bingo.status === 'in_progress'
                          ? 'bg-primary'
                          : 'bg-muted-foreground/60'
                      }`}
                    />

                    {t(`bingos.status.${bingo.status}`)}
                  </span>
                </div>

                <div className="relative flex flex-col gap-3">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <CalendarDays className="size-4 shrink-0" />
                    <span>{formatDate(bingo.date)}</span>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Grid3X3 className="size-4 shrink-0" />
                    <span>
                      {t('bingos.cardCount', { count: validCardCount })}
                    </span>
                  </div>
                </div>

                <ChevronRight className="text-muted-foreground group-hover:text-primary absolute right-4 bottom-4 size-4 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
