import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CirclePlay,
  Grid3X3,
  Layers3,
  Plus,
  Ticket,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { BingoStatusBadge } from '@/components/bingo/bingo-status-badge'
import { db } from '@/lib/database'

export function Home() {
  const { t, i18n } = useTranslation()

  const cards = useLiveQuery(() => db.cards.toArray(), [])
  const bingos = useLiveQuery(() => db.bingos.toArray(), [])
  const rounds = useLiveQuery(() => db.rounds.toArray(), [])

  if (cards === undefined || bingos === undefined || rounds === undefined) {
    return (
      <div className="text-muted-foreground py-10 text-center text-sm">
        {t('bingos.loading')}
      </div>
    )
  }

  const totalCards = cards.length
  const existingCardIds = new Set(cards.map((card) => card.id))
  const activeBingos = bingos.filter(
    (bingo) => bingo.status === 'in_progress',
  ).length

  const recentBingos = [...bingos]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3)

  const latestActiveRound = [...rounds]
    .filter((round) => round.status === 'in_progress')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .find((round) =>
      bingos.some(
        (bingo) => bingo.id === round.bingoId && bingo.status !== 'finished',
      ),
    )

  const activeRoundBingo = latestActiveRound
    ? bingos.find((bingo) => bingo.id === latestActiveRound.bingoId)
    : undefined

  const waitingBingo = [...bingos]
    .filter(
      (bingo) =>
        bingo.status !== 'finished' &&
        !rounds.some(
          (round) =>
            round.bingoId === bingo.id && round.status === 'in_progress',
        ) &&
        bingo.cardIds.some((id) => existingCardIds.has(id)),
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0]

  const isFirstVisit = totalCards === 0 && bingos.length === 0
  const hasOnlyCards = totalCards > 0 && bingos.length === 0
  const showWaitingBingo = !latestActiveRound && waitingBingo !== undefined

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('home.title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('home.description')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/cards"
          className="group bg-card border-border hover:border-primary/50 relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-sm"
        >
          <div
            aria-hidden
            className="bg-primary/15 pointer-events-none absolute -top-6 -right-6 size-20 rounded-full blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-2">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <Layers3 className="text-primary size-4" />
            </div>
            <span className="text-muted-foreground text-xs">
              {t('home.cards')}
            </span>
          </div>
          <p className="relative mt-3 text-3xl font-bold tabular-nums">
            {totalCards}
          </p>
          <p className="text-muted-foreground relative text-xs">
            {t('home.saved')}
          </p>
          <ArrowRight className="text-muted-foreground group-hover:text-primary absolute right-4 bottom-4 size-4 transition-all group-hover:translate-x-0.5" />
        </Link>

        <Link
          to="/bingos"
          className="group bg-card border-border hover:border-primary/50 relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-sm"
        >
          <div
            aria-hidden
            className="bg-primary/15 pointer-events-none absolute -top-6 -right-6 size-20 rounded-full blur-2xl"
          />
          <div className="relative flex items-center justify-between gap-2">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <Ticket className="text-primary size-4" />
            </div>
            <span className="text-muted-foreground text-xs">
              {t('home.bingos')}
            </span>
          </div>
          <p className="relative mt-3 text-3xl font-bold tabular-nums">
            {activeBingos}
          </p>
          <p className="text-muted-foreground relative text-xs">
            {t('home.inProgress')}
          </p>
          <ArrowRight className="text-muted-foreground group-hover:text-primary absolute right-4 bottom-4 size-4 transition-all group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isFirstVisit && (
        <section className="bg-card border-border relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-5 py-12 text-center">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="bg-primary/10 ring-primary/20 relative flex size-16 items-center justify-center rounded-full ring-4">
            <Grid3X3 className="text-primary size-7" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold">{t('home.empty.title')}</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              {t('home.empty.description')}
            </p>
          </div>
          <Link
            to="/cards/new"
            className="bg-primary text-primary-foreground relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('home.empty.createCard')}
          </Link>
          <p className="text-muted-foreground relative text-xs">
            {t('home.empty.nextStep')}
          </p>
        </section>
      )}

      {hasOnlyCards && (
        <section className="bg-card border-border relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-5 py-12 text-center">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
          />
          <div className="bg-primary/10 ring-primary/20 relative flex size-16 items-center justify-center rounded-full ring-4">
            <Ticket className="text-primary size-7" />
          </div>
          <div className="relative">
            <h2 className="text-lg font-semibold">{t('home.ready.title')}</h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              {t('home.ready.description', { count: totalCards })}
            </p>
          </div>
          <Link
            to="/bingos/new"
            className="bg-primary text-primary-foreground relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('home.ready.createBingo')}
          </Link>
        </section>
      )}

      {latestActiveRound && activeRoundBingo && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t('home.activeRound.title')}
          </h2>

          <div className="border-primary/40 from-primary/10 via-primary/5 relative flex flex-col gap-4 overflow-hidden rounded-xl border bg-gradient-to-r to-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-xl">
                <CirclePlay className="text-primary size-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">
                      {activeRoundBingo.name}
                    </h3>

                    <p className="text-primary mt-1 text-xs font-medium">
                      {t('bingos.rounds.roundNumber', {
                        number: latestActiveRound.number,
                      })}
                    </p>
                  </div>

                  <BingoStatusBadge status={latestActiveRound.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xl font-bold tabular-nums">
                  {latestActiveRound.drawnNumbers.length}

                  <span className="text-muted-foreground ml-1 text-xs font-normal">
                    / 75
                  </span>
                </p>

                <p className="text-muted-foreground mt-1 text-xs">
                  {t('home.activeRound.drawnNumbers')}
                </p>
              </div>

              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xl font-bold tabular-nums">
                  {latestActiveRound.cards
                    ? latestActiveRound.cards.length
                    : activeRoundBingo.cardIds.filter((id) =>
                        existingCardIds.has(id),
                      ).length}
                </p>

                <p className="text-muted-foreground mt-1 text-xs">
                  {t('home.activeRound.linkedCards')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                {t('home.activeRound.lastNumber')}
              </span>

              <div className="bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary text-sm font-bold tabular-nums">
                  {latestActiveRound.drawnNumbers.length > 0
                    ? `${(activeRoundBingo.columnLabels ?? 'BINGO')[Math.floor((latestActiveRound.drawnNumbers[latestActiveRound.drawnNumbers.length - 1] - 1) / 15)]}-${latestActiveRound.drawnNumbers[latestActiveRound.drawnNumbers.length - 1]}`
                    : '—'}
                </span>
              </div>
            </div>

            <Link
              to={`/bingos/${activeRoundBingo.id}/rounds/${latestActiveRound.id}`}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-colors"
            >
              <CirclePlay className="size-4" />

              {t('home.activeRound.continue')}

              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}

      {showWaitingBingo && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t('home.waiting.title')}
          </h2>

          <div className="bg-card border-border relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4">
            <div
              aria-hidden
              className="bg-primary/15 pointer-events-none absolute -top-6 -right-6 size-20 rounded-full blur-2xl"
            />

            <div className="relative flex items-center justify-between gap-2">
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
                {waitingBingo.name}
              </h3>

              <BingoStatusBadge status={waitingBingo.status} />
            </div>

            <p className="text-muted-foreground relative text-sm">
              {t('home.waiting.description', {
                count: waitingBingo.cardIds.filter((id) =>
                  existingCardIds.has(id),
                ).length,
              })}
            </p>

            <Link
              to={`/bingos/${waitingBingo.id}/rounds/new`}
              className="bg-primary text-primary-foreground relative flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
            >
              <CirclePlay className="size-4" />
              {t('home.waiting.startRound')}
            </Link>
          </div>
        </section>
      )}

      {recentBingos.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              {t('home.recentBingos.title')}
            </h2>
            <Link
              to="/bingos"
              className="text-primary group flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {t('home.recentBingos.viewAll')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {recentBingos.map((bingo) => (
              <Link
                key={bingo.id}
                to={`/bingos/${bingo.id}`}
                className="group bg-card border-border hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm"
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
                        count: bingo.cardIds.filter((id) =>
                          existingCardIds.has(id),
                        ).length,
                      })}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <BingoStatusBadge status={bingo.status} />

                  <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isFirstVisit && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/cards/new"
            className="border-border bg-card hover:bg-accent flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors"
          >
            <Layers3 className="size-4" />
            {t('home.actions.newCard')}
          </Link>
          <Link
            to="/bingos/new"
            className="bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('home.actions.newBingo')}
          </Link>
        </div>
      )}
    </div>
  )
}
