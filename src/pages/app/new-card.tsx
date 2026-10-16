import { ArrowLeft, Plus, RotateCcw, Save, Star } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { NumberPicker } from '@/components/bingo/number-picker'
import { type BingoCard } from '@/lib/database'
import { createCard, updateCard } from '@/services/card-service'

const columns = ['B', 'I', 'N', 'G', 'O']

const FREE_POSITION = 12
const TOTAL_NUMBERS = 24

interface NewCardProps {
  initialCard?: BingoCard
}

export function NewCard({ initialCard }: NewCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isEditing = initialCard !== undefined

  const [cardName, setCardName] = useState(initialCard?.name ?? '')
  const [numbers, setNumbers] = useState<(number | null)[]>(() =>
    initialCard ? [...initialCard.numbers] : Array(25).fill(null),
  )
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filledCount = numbers.filter((number) => number !== null).length

  const usedNumbers = numbers.filter(
    (number): number is number => number !== null,
  )

  function handlePositionClick(position: number) {
    if (position === FREE_POSITION || isSaving) return

    setSelectedPosition(position)
  }

  function handleNumberSelect(number: number) {
    if (selectedPosition === null || isSaving) return

    const columnIndex = selectedPosition % 5
    const min = columnIndex * 15 + 1
    const max = min + 14

    if (!Number.isInteger(number) || number < min || number > max) return

    const alreadyUsed = numbers.some(
      (value, index) => value === number && index !== selectedPosition,
    )

    if (alreadyUsed) return

    setNumbers((previous) =>
      previous.map((value, index) =>
        index === selectedPosition ? number : value,
      ),
    )

    setSaveError(null)
    setSelectedPosition(null)
  }

  function handleNumberRemove() {
    if (selectedPosition === null || isSaving) return

    setNumbers((previous) =>
      previous.map((value, index) =>
        index === selectedPosition ? null : value,
      ),
    )

    setSaveError(null)
    setSelectedPosition(null)
  }

  function handleClearCard() {
    if (isSaving) return

    setNumbers(Array(25).fill(null))
    setSelectedPosition(null)
    setSaveError(null)
  }

  async function handleSaveCard() {
    if (isSaving || filledCount !== TOTAL_NUMBERS) return

    if (!cardName.trim()) {
      setSaveError(t('cards.new.nameRequired'))
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      if (initialCard) {
        await updateCard(initialCard.id, cardName, numbers)
      } else {
        await createCard(cardName, numbers)
      }

      navigate('/cards')
    } catch (error) {
      console.error('Failed to save bingo card:', error)
      setSaveError(t('cards.new.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/cards"
          className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('cards.new.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? t('cards.edit.title') : t('cards.new.title')}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {isEditing
              ? t('cards.edit.description')
              : t('cards.new.description')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="card-name" className="text-sm font-medium">
          {t('cards.new.name')}
        </label>

        <input
          id="card-name"
          type="text"
          value={cardName}
          onChange={(event) => {
            setCardName(event.target.value)
            setSaveError(null)
          }}
          placeholder={t('cards.new.namePlaceholder')}
          maxLength={60}
          disabled={isSaving}
          className="bg-background border-input focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
        />
      </div>

      <section className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {t('cards.new.cardNumbers')}
          </h2>

          <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
            {filledCount}/{TOTAL_NUMBERS}
          </span>
        </div>

        <p className="text-muted-foreground text-sm">
          {t('cards.new.instructions')}
        </p>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {columns.map((column) => (
            <div
              key={column}
              className="bg-primary text-primary-foreground flex h-10 items-center justify-center rounded-lg text-lg font-bold"
            >
              {column}
            </div>
          ))}

          {numbers.map((number, position) => {
            const isFree = position === FREE_POSITION
            const isSelected = selectedPosition === position

            if (isFree) {
              return (
                <div
                  key={position}
                  className="bg-primary/10 text-primary flex aspect-square flex-col items-center justify-center rounded-lg"
                >
                  <Star className="size-5" />

                  <span className="mt-1 text-[9px] font-bold sm:text-xs">
                    {t('cards.new.free')}
                  </span>
                </div>
              )
            }

            return (
              <button
                key={position}
                type="button"
                onClick={() => handlePositionClick(position)}
                disabled={isSaving}
                className={`flex aspect-square items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-primary/30 ring-2'
                    : 'border-border bg-background hover:border-primary hover:bg-primary/5'
                }`}
                aria-label={t('cards.new.selectPosition', {
                  position: position + 1,
                })}
              >
                {number === null ? (
                  <Plus className="text-muted-foreground size-5" />
                ) : (
                  <span className="text-lg font-semibold">{number}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {t('cards.new.remaining', {
              count: TOTAL_NUMBERS - filledCount,
            })}
          </span>

          <button
            type="button"
            onClick={handleClearCard}
            disabled={filledCount === 0 || isSaving}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" />
            {t('cards.new.clear')}
          </button>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        {saveError && (
          <p role="alert" className="text-destructive text-sm">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            to="/cards"
            className="border-border hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            {t('cards.new.cancel')}
          </Link>

          <button
            type="button"
            onClick={handleSaveCard}
            disabled={filledCount !== TOTAL_NUMBERS || isSaving}
            className="bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />

            {isSaving
              ? t('cards.new.saving')
              : isEditing
                ? t('cards.edit.save')
                : t('cards.new.save')}
          </button>
        </div>
      </div>

      <NumberPicker
        open={selectedPosition !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPosition(null)
        }}
        columnIndex={selectedPosition === null ? 0 : selectedPosition % 5}
        currentNumber={
          selectedPosition === null ? null : numbers[selectedPosition]
        }
        usedNumbers={usedNumbers}
        onSelect={handleNumberSelect}
        onRemove={handleNumberRemove}
      />
    </div>
  )
}
