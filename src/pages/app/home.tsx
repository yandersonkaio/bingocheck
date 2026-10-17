import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CirclePlay,
  Clock3,
  Layers3,
  Plus,
  Ticket,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { db } from '@/lib/database'

export function Home() {
  const { t, i18n } = useTranslation()

  const cards = useLiveQuery(() => db.cards.toArray(), [])

  const bingos = useLiveQuery(() => db.bingos.toArray(), [])

  const rounds = useLiveQuery(() => db.rounds.toArray(), [])

  const isLoading =
    cards === undefined || bingos === undefined || rounds === undefined

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        {t('bingos.loading')}
      </div>
    )
  }

  const totalCards = cards.length

  const activeBingos = bingos.filter(
    (bingo) => bingo.status === 'in_progress',
  ).length

  const hasData = totalCards > 0 || bingos.length > 0

  const recentBingos = [...bingos]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3)

  const activeRounds = rounds
    .filter((round) => round.status === 'in_progress')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

  const latestActiveRound = activeRounds.find((round) =>
    bingos.some((bingo) => bingo.id === round.bingoId),
  )

  const activeRoundBingo = latestActiveRound
    ? bingos.find((bingo) => bingo.id === latestActiveRound.bingoId)
    : undefined

  function formatDate(date: string | null) {
    if (!date) return t('bingos.noDate')

    const [year, month, day] = date.split('-').map(Number)

    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(year, month - 1, day))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('home.title')}</h1>

        <p className="text-muted-foreground mt-1 text-sm">
          {t('home.description')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/cards"
          className="bg-card border-border hover:border-primary/50 rounded-xl border p-4 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <Layers3 className="text-muted-foreground size-5" />

            <span className="text-muted-foreground text-xs">
              {t('home.cards')}
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tabular-nums">{totalCards}</p>

          <p className="text-muted-foreground text-xs">{t('home.saved')}</p>
        </Link>

        <Link
          to="/bingos"
          className="bg-card border-border hover:border-primary/50 rounded-xl border p-4 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <Ticket className="text-muted-foreground size-5" />

            <span className="text-muted-foreground text-xs">
              {t('home.bingos')}
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold tabular-nums">{activeBingos}</p>

          <p className="text-muted-foreground text-xs">
            {t('home.inProgress')}
          </p>
        </Link>
      </div>

      {!hasData && (
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
      )}

      {latestActiveRound && activeRoundBingo && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            {t('home.activeRound.title')}
          </h2>

          <Link
            to={`/bingos/${activeRoundBingo.id}/rounds/${latestActiveRound.id}`}
            className="border-primary/40 bg-primary/5 hover:border-primary flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-xl">
              <CirclePlay className="text-primary size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold">
                {activeRoundBingo.name}
              </h3>

              <p className="text-primary mt-1 text-xs font-medium">
                {t('bingos.rounds.roundNumber', {
                  number: latestActiveRound.number,
                })}
              </p>

              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <Clock3 className="size-3.5" />

                {t('bingos.rounds.details.drawnCount', {
                  count: latestActiveRound.drawnNumbers.length,
                })}
              </p>
            </div>

            <ChevronRight className="text-primary size-5 shrink-0" />
          </Link>
        </section>
      )}

      {recentBingos.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {t('home.recentBingos.title')}
            </h2>

            <Link
              to="/bingos"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {t('home.recentBingos.viewAll')}

              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentBingos.map((bingo) => (
              <Link
                key={bingo.id}
                to={`/bingos/${bingo.id}`}
                className="bg-card border-border hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
              >
                <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-lg">
                  <Ticket className="text-primary size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {bingo.name}
                  </h3>

                  <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {formatDate(bingo.date)}
                    </span>

                    <span className="flex items-center gap-1">
                      <Layers3 className="size-3.5" />

                      {t('bingos.cardCount', {
                        count: bingo.cardIds.length,
                      })}
                    </span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      bingo.status === 'in_progress'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t(`bingos.status.${bingo.status}`)}
                  </span>

                  <ChevronRight className="text-muted-foreground size-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasData && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/cards/new"
            className="border-border hover:bg-accent flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors"
          >
            <Layers3 className="size-4" />

            {t('home.actions.newCard')}
          </Link>

          <Link
            to="/bingos/new"
            className="bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />

            {t('home.actions.newBingo')}
          </Link>
        </div>
      )}
    </div>
  )
}
