import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, FileQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router'

import { db } from '@/lib/database'
import { NewCard } from '@/pages/app/new-card'

export function EditCard() {
  const { id } = useParams()
  const { t } = useTranslation()
  const location = useLocation()

  const returnTo =
    typeof location.state?.returnTo === 'string' &&
    /^\/bingos\/[^/]+$/.test(location.state.returnTo)
      ? location.state.returnTo
      : '/cards'

  const card = useLiveQuery(
    () => (id ? db.cards.get(id).then((result) => result ?? null) : null),
    [id],
  )

  if (card === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="bg-card border-border relative h-24 overflow-hidden rounded-xl border">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-24 rounded-full blur-2xl"
          />

          <div className="relative flex h-full flex-col justify-center gap-2 p-4">
            <div className="bg-muted h-4 w-32 animate-pulse rounded" />
            <div className="bg-muted h-3 w-48 animate-pulse rounded" />
          </div>
        </div>

        <div className="text-muted-foreground py-10 text-center text-sm">
          {t('cards.loading')}
        </div>
      </div>
    )
  }

  if (card === null) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <Link
          to={returnTo}
          className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t('cards.new.back')}
        </Link>

        <section className="bg-card border-border relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-5 py-12 text-center">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
          />

          <div className="bg-primary/10 ring-primary/20 relative flex size-16 items-center justify-center rounded-full ring-4">
            <FileQuestion className="text-primary size-7" />
          </div>

          <div className="relative">
            <h1 className="text-lg font-semibold">
              {t('cards.edit.notFound')}
            </h1>
          </div>

          <Link
            to={returnTo}
            className="bg-primary text-primary-foreground relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            {t('cards.new.back')}
          </Link>
        </section>
      </div>
    )
  }

  return <NewCard key={card.id} initialCard={card} />
}
