import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, CalendarDays, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { db } from '@/lib/database'
import { updateBingo } from '@/services/bingo-service'

export function EditBingo() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [bingoName, setBingoName] = useState('')
  const [bingoDate, setBingoDate] = useState('')
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
  }, [bingo?.id])

  async function handleSave() {
    if (!id || isSaving || !bingo) return

    if (!bingoName.trim()) {
      setSaveError(t('bingos.new.nameRequired'))
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await updateBingo(id, { name: bingoName, date: bingoDate || null })
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
            onChange={(event) => setBingoDate(event.target.value)}
            disabled={isSaving}
            className="bg-background border-input focus-visible:ring-ring w-full min-w-0 rounded-lg border py-2.5 pr-3 pl-10 text-sm outline-none focus-visible:ring-2 disabled:opacity-50"
          />
        </div>
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
            disabled={isSaving}
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
