import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Flag,
  Pencil,
  RotateCcw,
  Save,
  Ticket,
  Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { BingoStatusBadge } from '@/components/bingo/bingo-status-badge'
import { type BingoCard, db, type RoundRule } from '@/lib/database'
import {
  finishRound,
  registerDrawnNumber,
  undoLastDrawnNumber,
  updateRoundRules,
} from '@/services/round-service'

const availableRules: RoundRule[] = ['line', 'column', 'diagonal', 'full_card']

const columns = ['B', 'I', 'N', 'G', 'O'] as const

type BingoLetter = (typeof columns)[number]

const patterns: Record<RoundRule, number[][]> = {
  line: Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, column) => row * 5 + column),
  ),
  column: Array.from({ length: 5 }, (_, column) =>
    Array.from({ length: 5 }, (_, row) => row * 5 + column),
  ),
  diagonal: [
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ],
  full_card: [Array.from({ length: 25 }, (_, index) => index)],
}

interface CardProgress {
  card: BingoCard
  remaining: number
  winningRule: RoundRule | null
}

function calculateProgress(
  card: BingoCard,
  drawnNumbers: Set<number>,
  rules: RoundRule[],
): CardProgress {
  let remaining = Infinity
  let winningRule: RoundRule | null = null

  for (const rule of rules) {
    for (const pattern of patterns[rule]) {
      const missing = pattern.filter((index) => {
        const number = card.numbers[index]

        return number !== null && !drawnNumbers.has(number)
      }).length

      if (missing < remaining) {
        remaining = missing
      }

      if (missing === 0 && winningRule === null) {
        winningRule = rule
      }
    }
  }

  return {
    card,
    remaining: Number.isFinite(remaining) ? remaining : 25,
    winningRule,
  }
}

export function RoundDetails() {
  const { id, roundId } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false)
  const [expandedCards, setExpandedCards] = useState<string[]>([])
  const [activeLetter, setActiveLetter] = useState<BingoLetter | null>(null)
  const [editingRules, setEditingRules] = useState(false)
  const [selectedRules, setSelectedRules] = useState<RoundRule[]>([])
  const [rulesError, setRulesError] = useState<string | null>(null)

  const bingo = useLiveQuery(
    () => (id ? db.bingos.get(id).then((result) => result ?? null) : null),
    [id],
  )

  const round = useLiveQuery(
    () =>
      roundId ? db.rounds.get(roundId).then((result) => result ?? null) : null,
    [roundId],
  )

  // Legacy active rounds keep the old behavior. Finished legacy rounds
  // cannot reliably reconstruct their original participants.
  const legacyCards = useLiveQuery(async (): Promise<BingoCard[]> => {
    if (
      !bingo ||
      !round ||
      round.cards !== undefined ||
      round.status === 'finished'
    ) {
      return []
    }

    const results = await db.cards.bulkGet(bingo.cardIds)
    return results.filter((card): card is BingoCard => card !== undefined)
  }, [bingo, round])

  const cards = round?.cards ?? legacyCards

  const drawnNumbers = useMemo(
    () => round?.drawnNumbers ?? [],
    [round?.drawnNumbers],
  )

  const drawnSet = useMemo(() => new Set(drawnNumbers), [drawnNumbers])

  const progress = useMemo(
    () =>
      (cards ?? [])
        .map((card) => calculateProgress(card, drawnSet, round?.rules ?? []))
        .sort((a, b) => a.remaining - b.remaining),
    [cards, drawnSet, round?.rules],
  )

  const displayColumns = (bingo?.columnLabels ?? 'BINGO').split('')

  const isFinished = round?.status === 'finished'
  const lastNumber = drawnNumbers[drawnNumbers.length - 1]

  const winners = progress.filter((item) => item.remaining === 0)
  const almostWinning = progress.filter((item) => item.remaining === 1)

  const activeColumnIndex =
    activeLetter !== null ? columns.indexOf(activeLetter) : -1

  function toggleLetter(letter: BingoLetter) {
    setActiveLetter((previous) => (previous === letter ? null : letter))
  }

  function startEditingRules() {
    if (!round || round.status !== 'in_progress' || isSaving) return
    setSelectedRules([...round.rules])
    setRulesError(null)
    setEditingRules(true)
  }

  function toggleRule(rule: RoundRule) {
    setSelectedRules((previous) =>
      previous.includes(rule)
        ? previous.filter((item) => item !== rule)
        : [...previous, rule],
    )
    setRulesError(null)
  }

  async function handleSaveRules() {
    if (!round || isFinished || isSaving) return

    if (selectedRules.length === 0) {
      setRulesError(t('bingos.rounds.details.rulesRequired'))
      return
    }

    setIsSaving(true)
    setRulesError(null)

    try {
      await updateRoundRules(round.id, selectedRules)
      setEditingRules(false)
    } catch (error) {
      console.error('Failed to update round rules:', error)
      setRulesError(t('bingos.rounds.details.rulesSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRegisterNumber(number: number) {
    if (!round || isFinished || isSaving || drawnSet.has(number)) return

    setIsSaving(true)
    setError(null)

    try {
      await registerDrawnNumber(round.id, number)
    } catch (error) {
      console.error('Failed to register number:', error)

      setError(
        t('bingos.rounds.details.actionError', {
          defaultValue: 'Não foi possível registrar o número.',
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUndo() {
    if (!round || isFinished || isSaving || drawnNumbers.length === 0) return

    setIsSaving(true)
    setError(null)

    try {
      await undoLastDrawnNumber(round.id)
    } catch (error) {
      console.error('Failed to undo number:', error)

      setError(
        t('bingos.rounds.details.actionError', {
          defaultValue: 'Não foi possível atualizar a rodada.',
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleFinish() {
    if (!round || isFinished || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      await finishRound(round.id)

      navigate(`/bingos/${round.bingoId}`, { replace: true })
    } catch (error) {
      console.error('Failed to finish round:', error)

      setError(
        t('bingos.rounds.details.finishError', {
          defaultValue: 'Não foi possível finalizar a rodada.',
        }),
      )
    } finally {
      setIsSaving(false)
    }
  }

  function toggleCard(cardId: string) {
    setExpandedCards((previous) =>
      previous.includes(cardId)
        ? previous.filter((id) => id !== cardId)
        : [...previous, cardId],
    )
  }

  if (bingo === undefined || round === undefined || cards === undefined) {
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

  if (!bingo || !round || round.bingoId !== bingo.id) {
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
            <CircleAlert className="text-primary size-7" />
          </div>

          <h1 className="relative text-lg font-semibold">
            {t('bingos.rounds.details.notFound', {
              defaultValue: 'Rodada não encontrada',
            })}
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <div className="flex items-center gap-3">
        <Link
          to={`/bingos/${bingo.id}`}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('bingos.details.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">
            {t('bingos.rounds.roundNumber', {
              number: round.number,
            })}
          </h1>

          <p className="text-muted-foreground truncate text-sm">{bingo.name}</p>
        </div>

        <BingoStatusBadge status={round.status} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {t('bingos.rounds.details.rulesTitle')}
          </h2>

          {!isFinished && !editingRules && (
            <button
              type="button"
              onClick={startEditingRules}
              disabled={isSaving}
              className="text-primary hover:bg-primary/10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Pencil className="size-4" />
              {t('bingos.rounds.details.editRules')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {round.rules.map((rule) => (
            <span
              key={rule}
              className="bg-muted text-foreground/80 rounded-full px-3 py-1 text-xs font-medium"
            >
              {t(`bingos.rounds.rules.${rule}.title`)}
            </span>
          ))}
        </div>

        {editingRules && !isFinished && (
          <div className="bg-card border-border relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4">
            <div
              aria-hidden
              className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-24 rounded-full blur-3xl"
            />

            <p className="text-muted-foreground relative text-sm">
              {t('bingos.rounds.details.editRulesDescription')}
            </p>

            <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-2">
              {availableRules.map((rule) => {
                const selected = selectedRules.includes(rule)

                return (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => toggleRule(rule)}
                    disabled={isSaving}
                    aria-pressed={selected}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-all disabled:opacity-50 ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50'
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background'
                      }`}
                    >
                      {selected && <Check className="size-3.5" />}
                    </span>
                    {t(`bingos.rounds.rules.${rule}.title`)}
                  </button>
                )
              })}
            </div>

            {rulesError && (
              <p role="alert" className="text-destructive relative text-sm">
                {rulesError}
              </p>
            )}

            <div className="relative flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingRules(false)
                  setRulesError(null)
                }}
                disabled={isSaving}
                className="border-border bg-card hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t('bingos.rounds.details.cancelRules')}
              </button>
              <button
                type="button"
                onClick={handleSaveRules}
                disabled={isSaving || selectedRules.length === 0}
                className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Save className="size-4" />
                {isSaving
                  ? t('bingos.rounds.details.savingRules')
                  : t('bingos.rounds.details.saveRules')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-card border-border relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border p-5 text-center">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
        />

        <p className="text-muted-foreground relative text-sm">
          {t('bingos.rounds.details.lastNumber', {
            defaultValue: 'Último número anunciado',
          })}
        </p>

        <div className="text-primary relative text-4xl font-bold tabular-nums">
          {lastNumber !== undefined
            ? `${displayColumns[Math.floor((lastNumber - 1) / 15)]} ${lastNumber}`
            : '—'}
        </div>

        <p className="text-muted-foreground relative text-sm">
          {t('bingos.rounds.details.drawnCount', {
            count: drawnNumbers.length,
            defaultValue: '{{count}} de 75 números registrados',
          })}
        </p>

        {!isFinished && (
          <button
            type="button"
            onClick={handleUndo}
            disabled={isSaving || drawnNumbers.length === 0}
            className="text-muted-foreground hover:bg-accent hover:text-foreground relative mt-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <RotateCcw className="size-4" />

            {t('bingos.rounds.details.undo', {
              defaultValue: 'Desfazer último número',
            })}
          </button>
        )}
      </section>

      {winners.length > 0 && (
        <div
          role="status"
          className="border-bingo-win/40 bg-bingo-win/10 flex items-start gap-3 rounded-xl border p-4"
        >
          <Trophy className="text-bingo-win mt-0.5 size-5 shrink-0" />

          <div>
            <p className="text-bingo-win font-semibold">
              {t('bingos.rounds.details.winnerAlert', {
                count: winners.length,
                defaultValue: '{{count}} cartela(s) completaram uma regra!',
              })}
            </p>

            <p className="text-muted-foreground mt-1 text-sm">
              {winners.map((item) => item.card.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {almostWinning.length > 0 && (
        <div className="border-border bg-card flex items-start gap-3 rounded-xl border p-4">
          <CircleAlert className="text-primary mt-0.5 size-5 shrink-0" />

          <div>
            <p className="font-semibold">
              {t('bingos.rounds.details.almostAlert', {
                count: almostWinning.length,
                defaultValue: '{{count}} cartela(s) a um número de ganhar',
              })}
            </p>

            <p className="text-muted-foreground mt-1 text-sm">
              {almostWinning.map((item) => item.card.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t('bingos.rounds.details.numbersTitle', {
              defaultValue: 'Números anunciados',
            })}
          </h2>

          <span className="text-muted-foreground text-sm tabular-nums">
            {drawnNumbers.length}/75
          </span>
        </div>

        {/* Seletor compacto de letras */}
        <div className="grid grid-cols-5 gap-2">
          {columns.map((letter, columnIndex) => {
            const start = columnIndex * 15 + 1
            const end = start + 14
            const isExpanded = activeLetter === letter

            const drawnCount = drawnNumbers.filter(
              (number) => number >= start && number <= end,
            ).length

            return (
              <button
                key={letter}
                type="button"
                onClick={() => toggleLetter(letter)}
                aria-expanded={isExpanded}
                aria-controls="round-number-options"
                className={`group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 transition-all ${
                  isExpanded
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <span className="text-2xl font-bold">
                  {displayColumns[columnIndex]}
                </span>

                <span className="text-muted-foreground text-[10px] font-medium tabular-nums sm:text-xs">
                  {start}–{end}
                </span>

                <span
                  className={`text-[10px] tabular-nums ${
                    isExpanded ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {drawnCount}/15
                </span>

                {isExpanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            )
          })}
        </div>

        {/* Mostra apenas os números da letra selecionada */}
        {activeLetter !== null && activeColumnIndex !== -1 && (
          <div
            id="round-number-options"
            className="bg-muted/40 border-border rounded-xl border p-3 sm:p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {displayColumns[activeColumnIndex]} ·{' '}
                {activeColumnIndex * 15 + 1}–{(activeColumnIndex + 1) * 15}
              </p>

              <button
                type="button"
                onClick={() => setActiveLetter(null)}
                className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
              >
                {t('bingos.rounds.details.hideNumbers', {
                  defaultValue: 'Ocultar números',
                })}

                <ChevronUp className="size-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }, (_, index) => {
                const number = activeColumnIndex * 15 + index + 1
                const isDrawn = drawnSet.has(number)

                return (
                  <button
                    key={number}
                    type="button"
                    onClick={() => handleRegisterNumber(number)}
                    disabled={isFinished || isSaving || isDrawn}
                    aria-pressed={isDrawn}
                    aria-label={`${displayColumns[activeColumnIndex]} ${number}`}
                    className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-all sm:text-base ${
                      isDrawn
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card border-border hover:border-primary hover:bg-primary/5'
                    } disabled:cursor-default`}
                  >
                    {number}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Histórico na ordem em que os números foram registrados */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {t('bingos.rounds.details.drawHistoryTitle', {
              defaultValue: 'Histórico dos números',
            })}
          </h2>

          <span className="text-muted-foreground text-sm tabular-nums">
            {drawnNumbers.length}/75
          </span>
        </div>

        {drawnNumbers.length === 0 ? (
          <div className="bg-card border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
            {t('bingos.rounds.details.noDrawHistory', {
              defaultValue: 'Nenhum número anunciado até agora.',
            })}
          </div>
        ) : (
          <ol className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
            {drawnNumbers.map((number, index) => {
              const isLast = index === drawnNumbers.length - 1

              return (
                <li
                  key={`${index}-${number}`}
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-sm transition-colors ${
                    isLast
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <span
                    className={`text-[9px] font-medium tabular-nums ${
                      isLast
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {index + 1}º
                  </span>

                  <span className="text-xs font-semibold tabular-nums sm:text-sm">
                    {displayColumns[Math.floor((number - 1) / 15)]}-{number}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t('bingos.rounds.details.cardsTitle', {
              defaultValue: 'Minhas cartelas',
            })}
          </h2>

          <span className="text-muted-foreground text-sm tabular-nums">
            {progress.length}
          </span>
        </div>

        {isFinished && round.cards === undefined && (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
            {t('bingos.rounds.details.legacyCardsUnavailable')}
          </div>
        )}

        {progress.length === 0 &&
          !(isFinished && round.cards === undefined) && (
            <div className="border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              {t('bingos.details.noCards')}
            </div>
          )}

        {progress.map(({ card, remaining, winningRule }) => {
          const isExpanded = expandedCards.includes(card.id)
          const isWinner = remaining === 0
          const isAlmost = remaining === 1

          return (
            <div
              key={card.id}
              className={`bg-card overflow-hidden rounded-xl border transition-colors ${
                isWinner
                  ? 'border-bingo-win/40'
                  : isAlmost
                    ? 'border-primary/40'
                    : 'border-border'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                aria-expanded={isExpanded}
                className="hover:bg-accent/30 flex w-full items-center gap-3 p-4 text-left transition-colors"
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                    isWinner ? 'bg-bingo-win/10' : 'bg-primary/10'
                  }`}
                >
                  {isWinner ? (
                    <Trophy className="text-bingo-win size-5" />
                  ) : (
                    <Ticket className="text-primary size-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{card.name}</p>

                  <p
                    className={`mt-1 text-xs ${
                      isWinner
                        ? 'text-bingo-win font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isWinner
                      ? t('bingos.rounds.details.winner', {
                          defaultValue: 'Bingo! Regra completada',
                        })
                      : t('bingos.rounds.details.remaining', {
                          count: remaining,
                          defaultValue: 'Faltam {{count}} números',
                        })}
                  </p>
                </div>

                {isWinner ? (
                  <CheckCircle2 className="text-bingo-win size-5 shrink-0" />
                ) : isAlmost ? (
                  <span className="bg-primary/10 text-primary flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium">
                    <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                    {t('bingos.rounds.details.almost', {
                      defaultValue: 'Falta 1',
                    })}
                  </span>
                ) : null}

                {isExpanded ? (
                  <ChevronUp className="text-muted-foreground size-4" />
                ) : (
                  <ChevronDown className="text-muted-foreground size-4" />
                )}
              </button>

              {isExpanded && (
                <div className="border-border border-t p-4">
                  {winningRule && (
                    <p className="text-bingo-win mb-3 flex items-center gap-2 text-sm font-medium">
                      <Trophy className="size-4" />
                      {t(`bingos.rounds.rules.${winningRule}.title`)}
                    </p>
                  )}

                  <div className="mx-auto grid max-w-sm grid-cols-5 gap-1.5">
                    {columns.map((letter, index) => (
                      <div
                        key={letter}
                        className="bg-primary/10 text-primary rounded-md py-2 text-center text-sm font-bold"
                      >
                        {displayColumns[index]}
                      </div>
                    ))}

                    {card.numbers.map((number, index) => {
                      const isFree = number === null
                      const isMarked = isFree || drawnSet.has(number)

                      return (
                        <div
                          key={index}
                          className={`flex aspect-square items-center justify-center rounded-md border text-sm font-medium ${
                            isMarked
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border'
                          }`}
                        >
                          {isFree ? <Check className="size-4" /> : number}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {!isFinished && (
        <section className="border-border flex flex-col gap-3 border-t pt-5">
          {showFinishConfirmation ? (
            <div className="bg-card border-border relative flex flex-col gap-4 overflow-hidden rounded-xl border p-4">
              <div
                aria-hidden
                className="bg-primary/10 pointer-events-none absolute -top-10 -right-10 size-24 rounded-full blur-3xl"
              />

              <p className="relative text-sm font-medium">
                {t('bingos.rounds.details.confirmFinish', {
                  defaultValue:
                    'Deseja finalizar esta rodada? Os números registrados serão preservados no histórico.',
                })}
              </p>

              <div className="relative flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFinishConfirmation(false)}
                  disabled={isSaving}
                  className="border-border bg-card hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {t('bingos.rounds.new.cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Flag className="size-4" />

                  {t('bingos.rounds.details.finish', {
                    defaultValue: 'Finalizar rodada',
                  })}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFinishConfirmation(true)}
              className="border-border bg-card hover:bg-accent flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
            >
              <Flag className="size-4" />

              {t('bingos.rounds.details.finish', {
                defaultValue: 'Finalizar rodada',
              })}
            </button>
          )}
        </section>
      )}

      {isFinished && (
        <div className="bg-muted/50 text-muted-foreground flex items-center justify-center gap-2 rounded-xl p-4 text-sm">
          <CheckCircle2 className="size-5" />

          {t('bingos.rounds.details.finishedMessage', {
            defaultValue:
              'Rodada finalizada. Histórico disponível para consulta.',
          })}
        </div>
      )}
    </div>
  )
}
