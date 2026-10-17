import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Flag,
  RotateCcw,
  Ticket,
  Trophy,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { type BingoCard, db, type RoundRule } from '@/lib/database'
import {
  finishRound,
  registerDrawnNumber,
  undoLastDrawnNumber,
} from '@/services/round-service'

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

function getLetter(number: number): BingoLetter {
  return columns[Math.floor((number - 1) / 15)]
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

  const isFinished = round?.status === 'finished'
  const lastNumber = drawnNumbers[drawnNumbers.length - 1]

  const winners = progress.filter((item) => item.remaining === 0)
  const almostWinning = progress.filter((item) => item.remaining === 1)

  const activeColumnIndex =
    activeLetter !== null ? columns.indexOf(activeLetter) : -1

  function toggleLetter(letter: BingoLetter) {
    setActiveLetter((previous) => (previous === letter ? null : letter))
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
      <div className="text-muted-foreground py-10 text-center text-sm">
        {t('bingos.loading')}
      </div>
    )
  }

  if (!bingo || !round || round.bingoId !== bingo.id) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-10 text-center">
        <h1 className="text-xl font-semibold">
          {t('bingos.rounds.details.notFound', {
            defaultValue: 'Rodada não encontrada',
          })}
        </h1>

        <Link to="/bingos" className="text-primary text-sm font-medium">
          {t('bingos.details.back')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/bingos/${bingo.id}`}
          className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
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

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isFinished
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {isFinished
            ? t('bingos.rounds.details.finished', {
                defaultValue: 'Finalizada',
              })
            : t('bingos.rounds.details.inProgress', {
                defaultValue: 'Em andamento',
              })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {round.rules.map((rule) => (
          <span
            key={rule}
            className="bg-muted rounded-full px-3 py-1 text-xs font-medium"
          >
            {t(`bingos.rounds.rules.${rule}.title`)}
          </span>
        ))}
      </div>

      <section className="bg-card border-border flex flex-col items-center gap-2 rounded-xl border p-5 text-center">
        <p className="text-muted-foreground text-sm">
          {t('bingos.rounds.details.lastNumber', {
            defaultValue: 'Último número anunciado',
          })}
        </p>

        <div className="text-primary text-4xl font-bold tabular-nums">
          {lastNumber !== undefined
            ? `${getLetter(lastNumber)} ${lastNumber}`
            : '—'}
        </div>

        <p className="text-muted-foreground text-sm">
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
            className="text-muted-foreground hover:text-foreground mt-2 flex items-center gap-2 text-sm font-medium disabled:opacity-40"
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
          className="border-primary/40 bg-primary/5 flex items-start gap-3 rounded-xl border p-4"
        >
          <Trophy className="text-primary mt-0.5 size-5 shrink-0" />

          <div>
            <p className="font-semibold">
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
        <div className="border-border bg-muted/50 flex items-start gap-3 rounded-xl border p-4">
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

          <span className="text-muted-foreground text-sm">
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
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 transition-colors ${
                  isExpanded
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl font-bold">{letter}</span>

                <span className="text-muted-foreground text-[10px] font-medium tabular-nums sm:text-xs">
                  {start}–{end}
                </span>

                <span className="text-muted-foreground text-[10px] tabular-nums">
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
                {activeLetter} · {activeColumnIndex * 15 + 1}–
                {(activeColumnIndex + 1) * 15}
              </p>

              <button
                type="button"
                onClick={() => setActiveLetter(null)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium"
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
                    aria-label={`${activeLetter} ${number}`}
                    className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors sm:text-base ${
                      isDrawn
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card border-border hover:border-primary/50'
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
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-sm ${
                    isLast
                      ? 'bg-primary text-primary-foreground'
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
                    {getLetter(number)}-{number}
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

          <span className="text-muted-foreground text-sm">
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

          return (
            <div
              key={card.id}
              className="bg-card border-border overflow-hidden rounded-xl border"
            >
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  {remaining === 0 ? (
                    <Trophy className="text-primary size-5" />
                  ) : (
                    <Ticket className="text-primary size-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{card.name}</p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {remaining === 0
                      ? t('bingos.rounds.details.winner', {
                          defaultValue: 'Bingo! Regra completada',
                        })
                      : t('bingos.rounds.details.remaining', {
                          count: remaining,
                          defaultValue: 'Faltam {{count}} números',
                        })}
                  </p>
                </div>

                {remaining === 0 ? (
                  <CheckCircle2 className="text-primary size-5 shrink-0" />
                ) : remaining === 1 ? (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
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
                    <p className="text-primary mb-3 flex items-center gap-2 text-sm font-medium">
                      <Trophy className="size-4" />
                      {t(`bingos.rounds.rules.${winningRule}.title`)}
                    </p>
                  )}

                  <div className="mx-auto grid max-w-sm grid-cols-5 gap-1.5">
                    {columns.map((letter) => (
                      <div
                        key={letter}
                        className="bg-primary/10 text-primary rounded-md py-2 text-center text-sm font-bold"
                      >
                        {letter}
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
            <div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4">
              <p className="text-sm font-medium">
                {t('bingos.rounds.details.confirmFinish', {
                  defaultValue:
                    'Deseja finalizar esta rodada? Os números registrados serão preservados no histórico.',
                })}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFinishConfirmation(false)}
                  disabled={isSaving}
                  className="border-border flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium"
                >
                  {t('bingos.rounds.new.cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
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
              className="border-border hover:bg-accent flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium"
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
