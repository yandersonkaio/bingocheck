import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock3,
  Flag,
  Grid3X3,
  Pencil,
  Plus,
  RotateCcw,
  Ticket,
  Trash2,
  Trophy,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { type BingoCard, type BingoRound, db } from '@/lib/database'
import { finishBingo, reopenBingo } from '@/services/bingo-service'

export function BingoDetails() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()

  const [confirmation, setConfirmation] = useState<'finish' | 'reopen' | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const bingo = useLiveQuery(
    () => (id ? db.bingos.get(id).then((result) => result ?? null) : null),
    [id],
  )

  const cards = useLiveQuery(async (): Promise<(BingoCard | undefined)[]> => {
    if (!bingo) return []

    return db.cards.bulkGet(bingo.cardIds)
  }, [bingo])

  const rounds = useLiveQuery(async (): Promise<BingoRound[]> => {
    if (!id) return []

    const results = await db.rounds.where('bingoId').equals(id).toArray()

    return results.sort((a, b) => b.number - a.number)
  }, [id])

  function formatDate(date: string | null) {
    if (!date) {
      return t('bingos.noDate')
    }

    const [year, month, day] = date.split('-').map(Number)

    return new Intl.DateTimeFormat(i18n.language, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, day))
  }

  async function handleConfirmAction() {
    if (!id || !confirmation || isSaving) return

    setIsSaving(true)
    setActionError(null)

    try {
      if (confirmation === 'finish') {
        await finishBingo(id)
      } else {
        await reopenBingo(id)
      }

      setConfirmation(null)
    } catch (error) {
      console.error('Failed to update bingo status:', error)

      setActionError(
        t('bingos.details.statusActionError', {
          defaultValue: 'Não foi possível atualizar o bingo. Tente novamente.',
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10 text-center">
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

  const linkedCards = (cards ?? []).filter(
    (card): card is BingoCard => card !== undefined,
  )

  const activeRound = rounds.find((round) => round.status === 'in_progress')

  const finishedRounds = rounds.filter((round) => round.status === 'finished')

  const isBingoFinished = bingo.status === 'finished'

  const canFinishBingo =
    !isBingoFinished && !activeRound && finishedRounds.length > 0

  function openConfirmation(action: 'finish' | 'reopen') {
    setActionError(null)
    setConfirmation(action)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Navegação e ações */}
      <div className="flex items-center gap-3">
        <Link
          to="/bingos"
          className="text-muted-foreground hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('bingos.details.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <span className="text-muted-foreground flex-1 text-sm">
          {t('bingos.details.back')}
        </span>

        {/* Ações visuais: serão implementadas depois */}
        <span
          className="text-muted-foreground flex size-9 items-center justify-center rounded-lg opacity-50"
          title={t('bingos.details.edit', {
            defaultValue: 'Editar bingo',
          })}
        >
          <Pencil className="size-4" />
        </span>

        <span
          className="text-muted-foreground flex size-9 items-center justify-center rounded-lg opacity-50"
          title={t('bingos.details.delete', {
            defaultValue: 'Excluir bingo',
          })}
        >
          <Trash2 className="size-4" />
        </span>
      </div>

      {/* Informações do bingo */}
      <section className="bg-card border-border flex flex-col gap-4 rounded-xl border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight break-words">
              {bingo.name}
            </h1>

            <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 shrink-0" />
              <span>{formatDate(bingo.date)}</span>
            </div>

            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <Ticket className="size-4 shrink-0" />

              <span>
                {t('bingos.cardCount', {
                  count: bingo.cardIds.length,
                })}
              </span>
            </div>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              isBingoFinished
                ? 'bg-muted text-muted-foreground'
                : bingo.status === 'in_progress'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {t(`bingos.status.${bingo.status}`)}
          </span>
        </div>
      </section>

      {/* Rodadas */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {t('bingos.details.roundsTitle', {
                defaultValue: 'Rodadas',
              })}
            </h2>

            {rounds.length > 0 && (
              <p className="text-muted-foreground mt-1 text-sm">
                {t('bingos.details.roundCount', {
                  count: rounds.length,
                  defaultValue: '{{count}} rodada(s)',
                })}
              </p>
            )}
          </div>

          {rounds.length > 0 && !activeRound && !isBingoFinished && (
            <Link
              to={`/bingos/${bingo.id}/rounds/new`}
              className="bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />

              {t('bingos.details.newRound', {
                defaultValue: 'Nova rodada',
              })}
            </Link>
          )}
        </div>

        {/* Estado vazio */}
        {rounds.length === 0 && (
          <div className="bg-card border-border flex flex-col items-center gap-4 rounded-xl border px-5 py-8 text-center sm:py-10">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
              <CirclePlay className="text-primary size-8" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <h3 className="text-base font-semibold">
                {t('bingos.details.noRoundsTitle', {
                  defaultValue: 'Nenhuma rodada iniciada',
                })}
              </h3>

              <p className="text-muted-foreground max-w-sm text-sm">
                {t('bingos.details.noRoundsDescription', {
                  defaultValue:
                    'Escolha as regras de vitória e comece a acompanhar os números anunciados.',
                })}
              </p>
            </div>

            {!isBingoFinished && (
              <Link
                to={`/bingos/${bingo.id}/rounds/new`}
                className="bg-primary text-primary-foreground flex w-full max-w-sm items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" />

                {t('bingos.details.startFirstRound', {
                  defaultValue: 'Iniciar primeira rodada',
                })}
              </Link>
            )}
          </div>
        )}

        {/* Rodada em andamento */}
        {activeRound && (
          <Link
            to={`/bingos/${bingo.id}/rounds/${activeRound.id}`}
            className="bg-primary/5 border-primary/40 hover:border-primary flex items-center gap-3 rounded-xl border p-4 transition-colors"
          >
            <div className="bg-primary/10 flex size-11 shrink-0 items-center justify-center rounded-lg">
              <CirclePlay className="text-primary size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">
                {t('bingos.rounds.roundNumber', {
                  number: activeRound.number,
                })}
              </h3>

              <p className="text-primary mt-1 flex items-center gap-1.5 text-xs font-medium">
                <Clock3 className="size-3.5" />

                {t('bingos.rounds.details.inProgress', {
                  defaultValue: 'Em andamento',
                })}
              </p>

              <p className="text-muted-foreground mt-1 text-xs">
                {t('bingos.rounds.details.drawnCount', {
                  count: activeRound.drawnNumbers.length,
                  defaultValue: '{{count}} de 75 números registrados',
                })}
              </p>
            </div>

            <ChevronRight className="text-primary size-5 shrink-0" />
          </Link>
        )}

        {/* Histórico das rodadas finalizadas */}
        {finishedRounds.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-muted-foreground text-sm font-medium">
              {t('bingos.details.roundHistory', {
                defaultValue: 'Histórico de rodadas',
              })}
            </h3>

            {finishedRounds.map((round) => {
              const winners = round.winners
              const hasSavedResult = winners !== undefined
              const hasBingo = (winners?.length ?? 0) > 0

              return (
                <Link
                  key={round.id}
                  to={`/bingos/${bingo.id}/rounds/${round.id}`}
                  className="bg-card border-border hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                      hasBingo
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {hasBingo ? (
                      <Trophy className="size-5" />
                    ) : (
                      <CheckCircle2 className="size-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold">
                        {t('bingos.rounds.roundNumber', {
                          number: round.number,
                        })}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          hasBingo
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {!hasSavedResult
                          ? t('bingos.details.resultUnavailable', {
                              defaultValue: 'Resultado não registrado',
                            })
                          : hasBingo
                            ? t('bingos.details.withBingo', {
                                defaultValue: 'Bingo!',
                              })
                            : t('bingos.details.withoutBingo', {
                                defaultValue: 'Sem bingo',
                              })}
                      </span>
                    </div>

                    <p className="text-muted-foreground mt-1 text-xs">
                      {t('bingos.rounds.details.finished', {
                        defaultValue: 'Finalizada',
                      })}
                      {' · '}
                      {t('bingos.rounds.details.drawnCount', {
                        count: round.drawnNumbers.length,
                        defaultValue: '{{count}} de 75 números registrados',
                      })}
                    </p>

                    {hasBingo && (
                      <div className="mt-2 flex flex-col gap-1">
                        {winners?.map((winner) => (
                          <p
                            key={winner.cardId}
                            className="text-xs text-green-600 dark:text-green-400"
                          >
                            <span className="font-medium">
                              {winner.cardName}
                            </span>
                            {' · '}
                            {winner.rules
                              .map((rule) =>
                                t(`bingos.rounds.rules.${rule}.title`),
                              )
                              .join(', ')}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {round.rules.map((rule) => (
                        <span
                          key={rule}
                          className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
                        >
                          {t(`bingos.rounds.rules.${rule}.title`)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Cartelas vinculadas */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {t('bingos.details.cardsTitle')}
            </h2>

            <p className="text-muted-foreground mt-1 text-sm">
              {t('bingos.cardCount', {
                count: bingo.cardIds.length,
              })}
            </p>
          </div>
        </div>

        {cards === undefined && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {t('bingos.new.loadingCards')}
          </p>
        )}

        {cards !== undefined && linkedCards.length === 0 && (
          <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border border-dashed px-5 py-10 text-center">
            <div className="bg-primary/10 flex size-12 items-center justify-center rounded-full">
              <Ticket className="text-primary size-6" />
            </div>

            <p className="text-muted-foreground max-w-sm text-sm">
              {t('bingos.details.noCards')}
            </p>
          </div>
        )}

        {linkedCards.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {linkedCards.map((card) => (
              <Link
                key={card.id}
                to={`/cards/${card.id}/edit`}
                state={{ returnTo: `/bingos/${bingo.id}` }}
                className="bg-card border-border hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
              >
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Grid3X3 className="text-primary size-5" />
                </div>

                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {card.name}
                </span>

                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Encerramento e reabertura do bingo */}
      {(canFinishBingo || isBingoFinished) && (
        <section className="border-border flex flex-col gap-3 border-t pt-5">
          {confirmation ? (
            <div className="bg-card border-border flex flex-col gap-4 rounded-xl border p-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">
                  {confirmation === 'finish'
                    ? t('bingos.details.confirmFinishTitle', {
                        defaultValue: 'Finalizar bingo?',
                      })
                    : t('bingos.details.confirmReopenTitle', {
                        defaultValue: 'Reabrir bingo?',
                      })}
                </h2>

                <p className="text-muted-foreground text-sm">
                  {confirmation === 'finish'
                    ? t('bingos.details.confirmFinishDescription', {
                        defaultValue:
                          'O bingo será encerrado e não será possível iniciar novas rodadas até que ele seja reaberto. Todo o histórico será preservado.',
                      })
                    : t('bingos.details.confirmReopenDescription', {
                        defaultValue:
                          'O bingo voltará a ficar em andamento e você poderá iniciar novas rodadas. O histórico anterior será mantido.',
                      })}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  disabled={isSaving}
                  className="border-border hover:bg-accent flex flex-1 items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {t('bingos.rounds.new.cancel')}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isSaving}
                  className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {confirmation === 'finish' ? (
                    <Flag className="size-4" />
                  ) : (
                    <RotateCcw className="size-4" />
                  )}

                  {isSaving
                    ? t('bingos.details.savingStatus', {
                        defaultValue: 'Salvando...',
                      })
                    : confirmation === 'finish'
                      ? t('bingos.details.finishBingo', {
                          defaultValue: 'Finalizar bingo',
                        })
                      : t('bingos.details.reopenBingo', {
                          defaultValue: 'Reabrir bingo',
                        })}
                </button>
              </div>
            </div>
          ) : (
            <>
              {isBingoFinished && (
                <div className="bg-muted/50 text-muted-foreground flex items-start gap-3 rounded-xl p-4 text-sm">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

                  <p>
                    {t('bingos.details.finishedMessage', {
                      defaultValue:
                        'Este bingo foi finalizado. As rodadas e os números anunciados continuam disponíveis para consulta.',
                    })}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  openConfirmation(isBingoFinished ? 'reopen' : 'finish')
                }
                className="border-border hover:bg-accent flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
              >
                {isBingoFinished ? (
                  <RotateCcw className="size-4" />
                ) : (
                  <Flag className="size-4" />
                )}

                {isBingoFinished
                  ? t('bingos.details.reopenBingo', {
                      defaultValue: 'Reabrir bingo',
                    })
                  : t('bingos.details.finishBingo', {
                      defaultValue: 'Finalizar bingo',
                    })}
              </button>
            </>
          )}

          {actionError && (
            <p role="alert" className="text-destructive text-sm">
              {actionError}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
