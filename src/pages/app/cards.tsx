import { useLiveQuery } from 'dexie-react-hooks'
import { Copy, Grid3X3, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { type BingoCard, db } from '@/lib/database'
import { deleteCard, duplicateCard } from '@/services/card-service'

const columns = ['B', 'I', 'N', 'G', 'O']
const FREE_POSITION = 12

function CardPreview({ numbers }: { numbers: BingoCard['numbers'] }) {
  const { t } = useTranslation()

  return (
    <div className="grid w-full grid-cols-5 gap-1">
      {columns.map((column) => (
        <div
          key={column}
          className="bg-primary text-primary-foreground flex h-7 items-center justify-center rounded text-xs font-bold"
        >
          {column}
        </div>
      ))}

      {numbers.map((number, position) => (
        <div
          key={position}
          className={`flex h-7 items-center justify-center rounded text-xs font-semibold ${
            position === FREE_POSITION
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-foreground'
          }`}
          title={
            position === FREE_POSITION
              ? t('cards.new.free')
              : String(number ?? '')
          }
        >
          {position === FREE_POSITION ? <Star className="size-3.5" /> : number}
        </div>
      ))}
    </div>
  )
}

export function Cards() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const cards = useLiveQuery(
    () => db.cards.orderBy('createdAt').reverse().toArray(),
    [],
  )

  const isLoading = cards === undefined

  const filteredCards = (cards ?? []).filter((card) =>
    card.name
      .toLocaleLowerCase(i18n.language)
      .includes(search.trim().toLocaleLowerCase(i18n.language)),
  )

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))
  }

  async function handleDuplicate(id: string) {
    if (busyId !== null) return

    setBusyId(id)
    setDeletingId(null)
    setActionError(null)

    try {
      await duplicateCard(id)
    } catch (error) {
      console.error('Failed to duplicate bingo card:', error)
      setActionError(t('cards.actions.duplicateError'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (busyId !== null) return

    setBusyId(id)
    setActionError(null)

    try {
      await deleteCard(id)
      setDeletingId(null)
    } catch (error) {
      console.error('Failed to delete bingo card:', error)
      setActionError(t('cards.actions.deleteError'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('cards.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {t('cards.description')}
          </p>
        </div>

        <Link
          to="/cards/new"
          className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          <span>{t('cards.newCard')}</span>
        </Link>
      </div>

      {!isLoading && cards.length > 0 && (
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('cards.searchPlaceholder')}
            aria-label={t('cards.searchPlaceholder')}
            className="bg-background border-input focus-visible:ring-ring w-full rounded-lg border py-3 pr-4 pl-10 text-sm outline-none focus-visible:ring-2"
          />
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-destructive text-sm">
          {actionError}
        </p>
      )}

      {isLoading && (
        <div className="text-muted-foreground py-10 text-center text-sm">
          {t('cards.loading')}
        </div>
      )}

      {!isLoading && cards.length === 0 && (
        <section className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border px-5 py-10 text-center">
          <div className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
            <Grid3X3 className="text-primary size-7" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t('cards.empty.title')}</h2>

            <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
              {t('cards.empty.description')}
            </p>
          </div>

          <Link
            to="/cards/new"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t('cards.empty.addCard')}
          </Link>
        </section>
      )}

      {!isLoading && cards.length > 0 && filteredCards.length === 0 && (
        <div className="text-muted-foreground py-10 text-center text-sm">
          {t('cards.noSearchResults')}
        </div>
      )}

      {!isLoading && filteredCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredCards.map((card) => {
            const isDeleting = deletingId === card.id
            const isBusy = busyId !== null

            return (
              <article
                key={card.id}
                className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold">
                      {card.name}
                    </h2>

                    <p className="text-muted-foreground mt-1 text-xs">
                      {t('cards.createdAt', {
                        date: formatDate(card.createdAt),
                      })}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/cards/${card.id}/edit`)}
                      disabled={isBusy}
                      title={t('cards.actions.edit')}
                      aria-label={t('cards.actions.edit')}
                      className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Pencil className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(card.id)}
                      disabled={isBusy}
                      title={t('cards.actions.duplicate')}
                      aria-label={t('cards.actions.duplicate')}
                      className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Copy className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeletingId(isDeleting ? null : card.id)
                        setActionError(null)
                      }}
                      disabled={isBusy}
                      title={t('cards.actions.delete')}
                      aria-label={t('cards.actions.delete')}
                      aria-expanded={isDeleting}
                      className="text-destructive hover:bg-destructive/10 flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <CardPreview numbers={card.numbers} />

                {isDeleting && (
                  <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground text-sm">
                      {t('cards.actions.deleteConfirmation', {
                        name: card.name,
                      })}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        disabled={isBusy}
                        className="border-border hover:bg-accent rounded-full border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {t('cards.actions.cancel')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        disabled={isBusy}
                        className="bg-destructive text-destructive-foreground rounded-full px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {busyId === card.id
                          ? t('cards.actions.deleting')
                          : t('cards.actions.confirmDelete')}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
