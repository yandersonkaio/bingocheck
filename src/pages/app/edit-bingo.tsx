import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  RotateCcw,
  Save,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { db } from '@/lib/database'
import { updateBingo } from '@/services/bingo-service'

const DEFAULT_COLUMN_LABELS = 'BINGO'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function EditBingo() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [bingoName, setBingoName] = useState('')
  const [bingoDate, setBingoDate] = useState('')
  const [columnLabels, setColumnLabels] = useState<string[]>(
    DEFAULT_COLUMN_LABELS.split(''),
  )
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const bingo = useLiveQuery(
    () => (id ? db.bingos.get(id).then((result) => result ?? null) : null),
    [id],
  )

  useEffect(() => {
    if (!bingo) return

    setBingoName(bingo.name)
    setBingoDate(bingo.date ?? '')
    setColumnLabels((bingo.columnLabels ?? DEFAULT_COLUMN_LABELS).split(''))
    setSelectedColumn(null)
  }, [bingo?.id])

  function selectLetter(letter: string) {
    if (selectedColumn === null) return

    const isUsed = columnLabels.some(
      (value, index) => index !== selectedColumn && value === letter,
    )

    if (isUsed) return

    setColumnLabels((previous) =>
      previous.map((value, index) =>
        index === selectedColumn ? letter : value,
      ),
    )

    setSelectedColumn(null)
    setSaveError(null)
  }

  function removeLetter() {
    if (selectedColumn === null) return

    setColumnLabels((previous) =>
      previous.map((value, index) => (index === selectedColumn ? '' : value)),
    )

    setSelectedColumn(null)
    setSaveError(null)
  }

  function restoreDefault() {
    setColumnLabels(DEFAULT_COLUMN_LABELS.split(''))
    setSelectedColumn(null)
    setSaveError(null)
  }

  async function handleSave() {
    if (!id || isSaving || !bingo) return

    if (!bingoName.trim()) {
      setSaveError(t('bingos.new.nameRequired'))
      return
    }

    if (
      columnLabels.length !== 5 ||
      columnLabels.some((letter) => !letter) ||
      new Set(columnLabels).size !== 5
    ) {
      setSaveError(t('bingos.edit.columnLabelsInvalid'))
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await updateBingo(id, {
        name: bingoName,
        date: bingoDate || null,
        columnLabels: columnLabels.join(''),
      })

      navigate(`/bingos/${id}`, { replace: true })
    } catch (error) {
      console.error('Failed to update bingo:', error)
      setSaveError(t('bingos.edit.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  if (bingo === undefined) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t('bingos.loading')}
      </p>
    )
  }

  if (bingo === null) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-10 text-center">
        <h1 className="text-xl font-semibold">
          {t('bingos.details.notFound')}
        </h1>
        <Link
          to="/bingos"
          className="text-primary text-sm font-medium hover:underline"
        >
          {t('bingos.details.back')}
        </Link>
      </div>
    )
  }

  const hasEmptyColumns = columnLabels.some((letter) => !letter)
  const isDefaultLabels = columnLabels.join('') === DEFAULT_COLUMN_LABELS

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/bingos/${id}`}
          className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('bingos.details.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('bingos.edit.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t('bingos.edit.description')}
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
          maxLength={60}
          disabled={isSaving}
          className="bg-background border-input focus-visible:ring-ring w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
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
            onChange={(event) => {
              setBingoDate(event.target.value)
              setSaveError(null)
            }}
            disabled={isSaving}
            className="bg-background border-input focus-visible:ring-ring w-full min-w-0 rounded-lg border py-2.5 pr-3 pl-10 text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium">
            {t('bingos.edit.columnLabels')}
          </label>

          <button
            type="button"
            onClick={restoreDefault}
            disabled={isSaving || isDefaultLabels}
            className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3.5" />
            {t('bingos.edit.restoreDefault')}
          </button>
        </div>

        <p className="text-muted-foreground text-xs">
          {t('bingos.edit.columnLabelsDescription')}
        </p>

        <div className="grid grid-cols-5 gap-2">
          {columnLabels.map((letter, index) => {
            const isSelected = selectedColumn === index

            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedColumn(isSelected ? null : index)}
                disabled={isSaving}
                aria-label={t('bingos.edit.editColumn', {
                  number: index + 1,
                })}
                aria-pressed={isSelected}
                className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border text-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-primary/20 ring-2'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {letter || <span className="text-muted-foreground">–</span>}

                <Pencil className="text-muted-foreground absolute right-1.5 bottom-1.5 size-3" />
              </button>
            )
          })}
        </div>

        {selectedColumn !== null && (
          <div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t('bingos.edit.selectLetter', {
                  number: selectedColumn + 1,
                })}
              </h3>

              <button
                type="button"
                onClick={() => setSelectedColumn(null)}
                className="text-muted-foreground hover:text-foreground flex size-7 cursor-pointer items-center justify-center rounded-lg transition-colors"
                aria-label={t('bingos.edit.closeLetterSelector')}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {ALPHABET.map((letter) => {
                const isUsed = columnLabels.some(
                  (value, index) =>
                    index !== selectedColumn && value === letter,
                )

                const isCurrent = columnLabels[selectedColumn] === letter

                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => selectLetter(letter)}
                    disabled={isSaving || isUsed}
                    aria-pressed={isCurrent}
                    className={`flex aspect-square cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                      isUsed
                        ? 'bg-muted/50 text-muted-foreground/30'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-accent'
                    }`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={removeLetter}
              disabled={isSaving || !columnLabels[selectedColumn]}
              className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="size-3.5" />
              {t('bingos.edit.removeLetter')}
            </button>
          </div>
        )}

        {hasEmptyColumns && (
          <p className="text-destructive text-xs">
            {t('bingos.edit.columnLabelsIncomplete')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {saveError && (
          <p role="alert" className="text-destructive text-sm">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            to={`/bingos/${id}`}
            className="border-border hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            {t('bingos.new.cancel')}
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || hasEmptyColumns}
            className="bg-primary text-primary-foreground inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="size-4" />
            {isSaving ? t('bingos.new.saving') : t('bingos.edit.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
