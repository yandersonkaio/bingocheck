import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, CalendarDays, Check, Grid3X3, Save } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { db } from '@/lib/database'
import { createBingo } from '@/services/bingo-service'

export function NewBingo() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [bingoName, setBingoName] = useState('')
  const [bingoDate, setBingoDate] = useState('')
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const cards = useLiveQuery(
    () => db.cards.orderBy('createdAt').reverse().toArray(),
    [],
  )

  const hasSelection = selectedCardIds.length > 0

  function toggleCard(id: string) {
    if (isSaving) return

    setSelectedCardIds((previous) =>
      previous.includes(id)
        ? previous.filter((cardId) => cardId !== id)
        : [...previous, id],
    )

    setSaveError(null)
  }

  async function handleSaveBingo() {
    if (isSaving) return

    if (!bingoName.trim()) {
      setSaveError(t('bingos.new.nameRequired'))
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await createBingo({
        name: bingoName,
        date: bingoDate || null,
        cardIds: selectedCardIds,
      })

      navigate('/bingos')
    } catch (error) {
      console.error('Failed to save bingo:', error)
      setSaveError(t('bingos.new.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-7">
      <div className="flex items-center gap-3">
        <Link
          to="/bingos"
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('bingos.new.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('bingos.new.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {t('bingos.new.description')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="bingo-name" className="text-sm font-medium">
          {t('bingos.new.name')}
        </label>

        <input
          id="bingo-name"
          type="text"
          value={bingoName}
          onChange={(event) => {
            setBingoName(event.target.value)
            setSaveError(null)
          }}
          placeholder={t('bingos.new.namePlaceholder')}
          maxLength={60}
          disabled={isSaving}
          className="bg-card border-input focus-visible:border-primary focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="bingo-date" className="text-sm font-medium">
          {t('bingos.new.date')}
        </label>

        <div className="relative">
          <CalendarDays className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

          <input
            id="bingo-date"
            type="date"
            value={bingoDate}
            onChange={(event) => setBingoDate(event.target.value)}
            disabled={isSaving}
            className="bg-card border-input focus-visible:border-primary focus-visible:ring-ring w-full min-w-0 rounded-lg border py-2.5 pr-3 pl-10 text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
          />
        </div>
      </div>

      <section className="bg-card border-border relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4">
        <div
          aria-hidden
          className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-28 rounded-full blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t('bingos.new.cards')}</h2>

          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              hasSelection
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                hasSelection
                  ? 'bg-primary-foreground'
                  : 'bg-primary animate-pulse'
              }`}
            />
            {selectedCardIds.length}
          </span>
        </div>

        <p className="text-muted-foreground relative text-sm">
          {t('bingos.new.cardsDescription')}
        </p>

        {cards === undefined && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {t('bingos.new.loadingCards')}
          </p>
        )}

        {cards !== undefined && cards.length === 0 && (
          <div className="border-border relative flex flex-col items-center gap-4 overflow-hidden rounded-lg border border-dashed px-4 py-8 text-center">
            <div
              aria-hidden
              className="bg-primary/15 pointer-events-none absolute -top-10 left-1/2 size-24 -translate-x-1/2 rounded-full blur-2xl"
            />

            <div className="bg-primary/10 ring-primary/20 relative flex size-14 items-center justify-center rounded-full ring-4">
              <Grid3X3 className="text-primary size-6" />
            </div>

            <p className="text-muted-foreground relative max-w-xs text-sm">
              {t('bingos.new.noCards')}
            </p>

            <Link
              to="/cards/new"
              className="border-border bg-card hover:bg-accent relative inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            >
              {t('bingos.new.createCard')}
            </Link>
          </div>
        )}

        {cards !== undefined && cards.length > 0 && (
          <div className="relative flex max-h-72 flex-col gap-2 overflow-y-auto">
            {cards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id)

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggleCard(card.id)}
                  disabled={isSaving}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all disabled:opacity-50 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background'
                    }`}
                  >
                    {isSelected && <Check className="size-3.5" />}
                  </div>

                  <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Grid3X3 className="text-primary size-4" />
                  </div>

                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {card.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {hasSelection && (
          <button
            type="button"
            onClick={() => setSelectedCardIds([])}
            disabled={isSaving}
            className="text-muted-foreground hover:bg-accent hover:text-foreground relative self-end rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {t('bingos.new.clearSelection')}
          </button>
        )}
      </section>

      <div className="flex flex-col gap-3">
        {saveError && (
          <p role="alert" className="text-destructive text-sm">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            to="/bingos"
            className="border-border bg-card hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            {t('bingos.new.cancel')}
          </Link>

          <button
            type="button"
            onClick={handleSaveBingo}
            disabled={isSaving || cards === undefined}
            className="bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />

            {isSaving ? t('bingos.new.saving') : t('bingos.new.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
