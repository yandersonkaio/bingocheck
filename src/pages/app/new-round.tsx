import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CirclePlay,
  Columns3,
  Grid3X3,
  Play,
  Rows3,
  Slash,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { type BingoRound, db, type RoundRule } from '@/lib/database'
import { createRound } from '@/services/round-service'

const availableRules: {
  id: RoundRule
  icon: typeof Rows3
}[] = [
  { id: 'line', icon: Rows3 },
  { id: 'column', icon: Columns3 },
  { id: 'diagonal', icon: Slash },
  { id: 'full_card', icon: Grid3X3 },
]

export function NewRound() {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [selectedRules, setSelectedRules] = useState<RoundRule[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const bingo = useLiveQuery(
    () => (id ? db.bingos.get(id).then((result) => result ?? null) : null),
    [id],
  )

  const rounds = useLiveQuery(async (): Promise<BingoRound[]> => {
    if (!id) return []

    return db.rounds.where('bingoId').equals(id).toArray()
  }, [id])

  const roundNumber =
    (rounds?.reduce((max, round) => Math.max(max, round.number), 0) ?? 0) + 1

  const activeRound = rounds?.find((round) => round.status === 'in_progress')

  const hasRules = selectedRules.length > 0

  function toggleRule(rule: RoundRule) {
    if (isSaving || activeRound) return

    setSelectedRules((previous) =>
      previous.includes(rule)
        ? previous.filter((item) => item !== rule)
        : [...previous, rule],
    )

    setSaveError(null)
  }

  async function handleStartRound() {
    if (!id || isSaving || activeRound || selectedRules.length === 0) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const roundId = await createRound({
        bingoId: id,
        rules: selectedRules,
      })

      navigate(`/bingos/${id}/rounds/${roundId}`, { replace: true })
    } catch (error) {
      console.error('Failed to create round:', error)

      setSaveError(
        t('bingos.rounds.new.saveError', {
          defaultValue: 'Não foi possível iniciar a rodada. Tente novamente.',
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (bingo === undefined || rounds === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="bg-card border-border relative h-20 overflow-hidden rounded-xl border">
          <div
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-24 rounded-full blur-2xl"
          />

          <div className="relative flex h-full flex-col justify-center gap-2 px-4">
            <div className="bg-muted h-4 w-40 animate-pulse rounded" />
            <div className="bg-muted h-3 w-56 animate-pulse rounded" />
          </div>
        </div>

        <div className="text-muted-foreground py-10 text-center text-sm">
          {t('bingos.loading')}
        </div>
      </div>
    )
  }

  if (bingo === null) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <Link
          to="/bingos"
          className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t('bingos.details.back')}
        </Link>

        <section className="bg-card border-border relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-5 py-12 text-center">
          <div
            aria-hidden
            className="bg-primary/20 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
          />

          <div className="bg-primary/10 ring-primary/20 relative flex size-16 items-center justify-center rounded-full ring-4">
            <Grid3X3 className="text-primary size-7" />
          </div>

          <h1 className="relative text-lg font-semibold">
            {t('bingos.details.notFound')}
          </h1>

          <Link
            to="/bingos"
            className="bg-primary text-primary-foreground relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
          >
            <ArrowLeft className="size-4" />
            {t('bingos.details.back')}
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-7">
      {/* Navegação */}
      <div className="flex items-center gap-3">
        <Link
          to={`/bingos/${bingo.id}`}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('bingos.details.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('bingos.rounds.new.title')}
          </h1>

          <p className="text-muted-foreground mt-1 truncate text-sm">
            {bingo.name} ·{' '}
            {t('bingos.rounds.roundNumber', {
              number: roundNumber,
            })}
          </p>
        </div>
      </div>

      {/* Aviso de rodada em andamento */}
      {activeRound && (
        <Link
          to={`/bingos/${bingo.id}/rounds/${activeRound.id}`}
          className="border-primary/40 from-primary/10 via-primary/5 hover:border-primary group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-gradient-to-r to-transparent p-4 transition-colors"
        >
          <div className="bg-primary/15 flex size-11 shrink-0 items-center justify-center rounded-lg">
            <CirclePlay className="text-primary size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {t('bingos.rounds.new.activeRoundWarning', {
                defaultValue: 'Já existe uma rodada em andamento neste bingo.',
              })}
            </p>

            <p className="text-primary mt-1 flex items-center gap-1.5 text-xs font-medium">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />

              {t('bingos.rounds.new.viewActiveRound', {
                defaultValue: 'Continuar rodada em andamento',
              })}
            </p>
          </div>

          <ChevronRight className="text-primary size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Regras de vitória */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {t('bingos.rounds.new.rulesTitle')}
          </h2>

          <p className="text-muted-foreground text-sm">
            {t('bingos.rounds.new.rulesDescription')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {availableRules.map(({ id: rule, icon: Icon }) => {
            const isSelected = selectedRules.includes(rule)

            return (
              <button
                key={rule}
                type="button"
                onClick={() => toggleRule(rule)}
                disabled={isSaving || !!activeRound}
                aria-pressed={isSelected}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div
                    aria-hidden
                    className="bg-primary/10 pointer-events-none absolute -top-8 -right-8 size-20 rounded-full blur-2xl"
                  />
                )}

                {/* Ícone */}
                <div
                  className={`relative flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  }`}
                >
                  <Icon className="size-5" />
                </div>

                {/* Título e descrição */}
                <div className="relative min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {t(`bingos.rounds.rules.${rule}.title`)}
                  </p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {t(`bingos.rounds.rules.${rule}.description`)}
                  </p>
                </div>

                {/* Indicador de seleção */}
                <div
                  className={`relative flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-input bg-background'
                  }`}
                >
                  {isSelected && <Check className="size-3.5" />}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Resumo da rodada */}
      <section className="bg-card border-border relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4">
        <div
          aria-hidden
          className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-24 rounded-full blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            {t('bingos.rounds.new.summary')}
          </h2>

          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              hasRules
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                hasRules ? 'bg-primary-foreground' : 'bg-primary animate-pulse'
              }`}
            />

            {t('bingos.rounds.new.selectedCount', {
              count: selectedRules.length,
            })}
          </span>
        </div>

        <p className="text-muted-foreground relative text-xs">
          {t('bingos.rounds.roundNumber', {
            number: roundNumber,
          })}
        </p>

        {hasRules ? (
          <div className="relative flex flex-wrap gap-2">
            {selectedRules.map((rule) => (
              <span
                key={rule}
                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium"
              >
                {t(`bingos.rounds.rules.${rule}.title`)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground relative text-xs">
            {t('bingos.rounds.new.noRules')}
          </p>
        )}
      </section>

      {/* Ações */}
      <div className="flex flex-col gap-3">
        {saveError && (
          <p role="alert" className="text-destructive text-sm">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            to={`/bingos/${bingo.id}`}
            className="border-border bg-card hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            {t('bingos.rounds.new.cancel')}
          </Link>

          <button
            type="button"
            onClick={handleStartRound}
            disabled={isSaving || !hasRules || !!activeRound}
            className="bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="size-4" />

            {isSaving
              ? t('bingos.rounds.new.starting', {
                  defaultValue: 'Iniciando...',
                })
              : t('bingos.rounds.new.start')}
          </button>
        </div>
      </div>
    </div>
  )
}
