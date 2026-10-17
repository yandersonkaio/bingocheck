import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Check,
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
      <div className="text-muted-foreground py-10 text-center text-sm">
        {t('bingos.loading')}
      </div>
    )
  }

  if (bingo === null) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
        <p>{t('bingos.details.notFound')}</p>

        <Link to="/bingos" className="text-primary text-sm font-medium">
          {t('bingos.details.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      {/* Navegação */}
      <div className="flex items-center gap-3">
        <Link
          to={`/bingos/${bingo.id}`}
          className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
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
        <div className="border-border bg-muted/50 flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm font-medium">
            {t('bingos.rounds.new.activeRoundWarning', {
              defaultValue: 'Já existe uma rodada em andamento neste bingo.',
            })}
          </p>

          <Link
            to={`/bingos/${bingo.id}/rounds/${activeRound.id}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            {t('bingos.rounds.new.viewActiveRound', {
              defaultValue: 'Continuar rodada em andamento',
            })}
          </Link>
        </div>
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
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                {/* Ícone */}
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="size-5" />
                </div>

                {/* Título e descrição */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {t(`bingos.rounds.rules.${rule}.title`)}
                  </p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {t(`bingos.rounds.rules.${rule}.description`)}
                  </p>
                </div>

                {/* Indicador de seleção */}
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-input'
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
      <section className="bg-muted/50 border-border flex flex-col gap-2 rounded-xl border p-4">
        <h2 className="text-sm font-semibold">
          {t('bingos.rounds.new.summary')}
        </h2>

        <p className="text-muted-foreground text-sm">
          {t('bingos.rounds.roundNumber', {
            number: roundNumber,
          })}{' '}
          ·{' '}
          {t('bingos.rounds.new.selectedCount', {
            count: selectedRules.length,
          })}
        </p>

        {selectedRules.length > 0 ? (
          <div className="flex flex-wrap gap-2">
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
          <p className="text-muted-foreground text-xs">
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
            className="border-border hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            {t('bingos.rounds.new.cancel')}
          </Link>

          <button
            type="button"
            onClick={handleStartRound}
            disabled={isSaving || selectedRules.length === 0 || !!activeRound}
            className="bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
