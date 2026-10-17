import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  CalendarDays,
  Check,
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
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import { type BingoCard, type BingoRound, db } from '@/lib/database'
import {
  deleteBingo,
  finishBingo,
  reopenBingo,
  updateBingoCards,
} from '@/services/bingo-service'

export function BingoDetails() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [confirmation, setConfirmation] = useState<'finish' | 'reopen' | null>(
    null,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const [cardError, setCardError] = useState<string | null>(null)
  const [isSavingCards, setIsSavingCards] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const bingo = useLiveQuery(
    () => (id ? db.bingos.get(id).then((result) => result ?? null) : null),
    [id],
  )

  const cards = useLiveQuery(async (): Promise<(BingoCard | undefined)[]> => {
    if (!bingo) return []

    return db.cards.bulkGet(bingo.cardIds)
  }, [bingo])

  const allCards = useLiveQuery(() => db.cards.toArray(), [])

  useEffect(() => {
    if (!isCardModalOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSavingCards) {
        setIsCardModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isCardModalOpen, isSavingCards])

  const rounds = useLiveQuery(async (): Promise<BingoRound[]> => {
    if (!id) return []

    const results = await db.rounds.where('bingoId').equals(id).toArray()

    return results.sort((a, b) => b.number - a.number)
  }, [id])

  function openCardModal() {
    if (
      !bingo ||
      bingo.status === 'finished' ||
      rounds?.some((round) => round.status === 'in_progress')
    )
      return

    if (allCards === undefined) return

    const existingCardIds = new Set(allCards.map((card) => card.id))

    setSelectedCardIds(
      bingo.cardIds.filter((cardId) => existingCardIds.has(cardId)),
    )
    setCardError(null)
    setIsCardModalOpen(true)
  }

  function toggleSelectedCard(cardId: string) {
    setSelectedCardIds((previous) =>
      previous.includes(cardId)
        ? previous.filter((id) => id !== cardId)
        : [...previous, cardId],
    )
  }

  async function handleSaveCards() {
    if (!id || isSavingCards) return

    setIsSavingCards(true)
    setCardError(null)

    try {
      const existingCards = await db.cards.toArray()
      const existingCardIds = new Set(existingCards.map((card) => card.id))
      const validSelectedIds = selectedCardIds.filter((cardId) =>
        existingCardIds.has(cardId),
      )

      await updateBingoCards(id, validSelectedIds)
      setIsCardModalOpen(false)
    } catch (error) {
      console.error('Failed to update bingo cards:', error)
      setCardError(
        t('bingos.details.manageCardsError', {
          defaultValue:
            'Não foi possível atualizar as cartelas. Tente novamente.',
        }),
      )
    } finally {
      setIsSavingCards(false)
    }
  }

  async function handleDeleteBingo() {
    if (!id || isDeleting) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteBingo(id)
      navigate('/bingos', { replace: true })
    } catch (error) {
      console.error('Failed to delete bingo:', error)
      setDeleteError(t('bingos.delete.error'))
    } finally {
      setIsDeleting(false)
    }
  }

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
  const canStartRound = cards !== undefined && linkedCards.length > 0
  const canManageCards = !isBingoFinished && !activeRound

  const canFinishBingo =
    !isBingoFinished && !activeRound && finishedRounds.length > 0

  function openConfirmation(action: 'finish' | 'reopen') {
    setActionError(null)
    setConfirmation(action)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <div className="flex items-center gap-3">
        <Link
          to="/bingos"
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={t('bingos.details.back')}
        >
          <ArrowLeft className="size-5" />
        </Link>

        <span className="text-muted-foreground flex-1 text-sm">
          {t('bingos.details.back')}
        </span>

        <Link
          to={`/bingos/${bingo.id}/edit`}
          className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 items-center justify-center rounded-lg transition-colors"
          title={t('bingos.details.edit')}
          aria-label={t('bingos.details.edit')}
        >
          <Pencil className="size-4" />
        </Link>

        <button
          type="button"
          onClick={() => {
            setDeleteError(null)
            setIsDeleteOpen(true)
          }}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
          title={t('bingos.details.delete')}
          aria-label={t('bingos.details.delete')}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <section className="bg-card border-border relative flex flex-col gap-4 overflow-hidden rounded-xl border p-5">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-3xl"
        />

        <div className="relative flex items-start justify-between gap-3">
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
                  count: linkedCards.length,
                })}
              </span>
            </div>
          </div>

          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isBingoFinished
                ? 'bg-muted text-muted-foreground'
                : bingo.status === 'in_progress'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                isBingoFinished
                  ? 'bg-muted-foreground/60'
                  : bingo.status === 'in_progress'
                    ? 'bg-primary'
                    : 'bg-muted-foreground/60'
              }`}
            />

            {t(`bingos.status.${bingo.status}`)}
          </span>
        </div>
      </section>

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

          {rounds.length > 0 &&
            !activeRound &&
            !isBingoFinished &&
            canStartRound && (
              <Link
                to={`/bingos/${bingo.id}/rounds/new`}
                className="bg-primary text-primary-foreground inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" />

                {t('bingos.details.newRound', {
                  defaultValue: 'Nova rodada',
                })}
              </Link>
            )}
        </div>

        {!isBingoFinished &&
          !activeRound &&
          !canStartRound &&
          cards !== undefined && (
            <div className="border-border bg-muted/40 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
              {t('bingos.details.cardsRequiredToStart', {
                defaultValue:
                  'Vincule pelo menos uma cartela a este bingo antes de iniciar uma rodada.',
              })}
            </div>
          )}

        {rounds.length === 0 && (
          <div className="bg-card border-border relative flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-5 py-10 text-center">
            <div
              aria-hidden
              className="bg-primary/20 pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full blur-3xl"
            />

            <div className="bg-primary/10 ring-primary/20 relative flex size-16 items-center justify-center rounded-full ring-4">
              <CirclePlay className="text-primary size-7" />
            </div>

            <div className="relative flex flex-col items-center gap-2">
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

            {!isBingoFinished && canStartRound && (
              <Link
                to={`/bingos/${bingo.id}/rounds/new`}
                className="bg-primary text-primary-foreground relative flex w-full max-w-sm items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="size-4" />

                {t('bingos.details.startFirstRound', {
                  defaultValue: 'Iniciar primeira rodada',
                })}
              </Link>
            )}
          </div>
        )}

        {activeRound && (
          <Link
            to={`/bingos/${bingo.id}/rounds/${activeRound.id}`}
            className="border-primary/40 from-primary/10 via-primary/5 hover:border-primary group relative flex items-center gap-3 overflow-hidden rounded-xl border bg-gradient-to-r to-transparent p-4 transition-colors"
          >
            <div className="bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-xl">
              <CirclePlay className="text-primary size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">
                {t('bingos.rounds.roundNumber', {
                  number: activeRound.number,
                })}
              </h3>

              <p className="text-primary mt-1 flex items-center gap-1.5 text-xs font-medium">
                <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                {t('bingos.rounds.details.inProgress', {
                  defaultValue: 'Em andamento',
                })}
              </p>

              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <Clock3 className="size-3.5" />

                {t('bingos.rounds.details.drawnCount', {
                  count: activeRound.drawnNumbers.length,
                  defaultValue: '{{count}} de 75 números registrados',
                })}
              </p>
            </div>

            <ChevronRight className="text-primary size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        {finishedRounds.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
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
                  className="group bg-card border-border hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm"
                >
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                      hasBingo
                        ? 'bg-bingo-win/10 text-bingo-win'
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
                            ? 'bg-bingo-win/10 text-bingo-win'
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
                            className="text-bingo-win text-xs"
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

                  <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {t('bingos.details.cardsTitle')}
            </h2>

            <p className="text-muted-foreground mt-1 text-sm">
              {t('bingos.cardCount', {
                count: linkedCards.length,
              })}
            </p>
          </div>

          {canManageCards && (
            <button
              type="button"
              onClick={openCardModal}
              className="border-border hover:bg-accent inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            >
              <Plus className="size-4" />
              {t('bingos.details.manageCards', {
                defaultValue: 'Gerenciar cartelas',
              })}
            </button>
          )}
        </div>

        {cards === undefined && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {t('bingos.new.loadingCards')}
          </p>
        )}

        {cards !== undefined && linkedCards.length === 0 && (
          <div className="bg-card border-border relative flex flex-col items-center gap-4 overflow-hidden rounded-xl border border-dashed px-5 py-10 text-center">
            <div
              aria-hidden
              className="bg-primary/15 pointer-events-none absolute -top-12 left-1/2 size-32 -translate-x-1/2 rounded-full blur-3xl"
            />

            <div className="bg-primary/10 ring-primary/20 relative flex size-14 items-center justify-center rounded-full ring-4">
              <Ticket className="text-primary size-6" />
            </div>

            <p className="text-muted-foreground relative max-w-sm text-sm">
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
                className="group bg-card border-border hover:border-primary/50 flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm"
              >
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Grid3X3 className="text-primary size-5" />
                </div>

                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {card.name}
                </span>

                <ChevronRight className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {isCardModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSavingCards) {
                setIsCardModalOpen(false)
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="manage-cards-title"
              className="bg-card border-border flex h-[85dvh] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border shadow-xl sm:h-auto sm:max-h-[85dvh] sm:rounded-xl"
            >
              <div className="border-border shrink-0 border-b px-4 pt-2 pb-4 sm:p-4">
                <div className="bg-muted-foreground/30 mx-auto mb-3 h-1.5 w-10 rounded-full sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2
                      id="manage-cards-title"
                      className="text-lg font-semibold"
                    >
                      {t('bingos.details.manageCards', {
                        defaultValue: 'Gerenciar cartelas',
                      })}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t('bingos.details.manageCardsDescription', {
                        defaultValue:
                          'Selecione as cartelas que deseja vincular a este bingo.',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    disabled={isSavingCards}
                    aria-label={t('bingos.rounds.new.cancel')}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground hidden cursor-pointer rounded-lg p-1 disabled:opacity-50 sm:inline-flex"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                {allCards === undefined ? (
                  <p className="text-muted-foreground py-6 text-center text-sm">
                    {t('bingos.new.loadingCards')}
                  </p>
                ) : allCards.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <Ticket className="text-muted-foreground size-8" />
                    <p className="text-muted-foreground text-sm">
                      {t('bingos.details.noAvailableCards', {
                        defaultValue:
                          'Você ainda não cadastrou nenhuma cartela.',
                      })}
                    </p>
                    <Link
                      to="/cards/new"
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      {t('bingos.details.createCard', {
                        defaultValue: 'Cadastrar cartela',
                      })}
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {allCards.map((card) => {
                      const selected = selectedCardIds.includes(card.id)

                      return (
                        <label
                          key={card.id}
                          className={`border-border flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelectedCard(card.id)}
                            disabled={isSavingCards}
                            className="accent-primary size-4 shrink-0 cursor-pointer"
                          />
                          <Grid3X3 className="text-muted-foreground size-5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {card.name}
                          </span>
                          {selected && (
                            <Check className="text-primary size-4 shrink-0" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-card border-border flex shrink-0 flex-col gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                <p className="text-muted-foreground text-xs">
                  {t('bingos.cardCount', { count: selectedCardIds.length })}
                </p>
                {cardError && (
                  <p role="alert" className="text-destructive text-sm">
                    {cardError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCardModalOpen(false)}
                    disabled={isSavingCards}
                    className="border-border hover:bg-accent flex-1 cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium disabled:opacity-50"
                  >
                    {t('bingos.rounds.new.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCards}
                    disabled={isSavingCards || allCards === undefined}
                    className="bg-primary text-primary-foreground flex-1 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium shadow-sm disabled:opacity-50"
                  >
                    {isSavingCards
                      ? t('bingos.details.savingStatus', {
                          defaultValue: 'Salvando...',
                        })
                      : t('bingos.details.saveCards', {
                          defaultValue: 'Salvar alterações',
                        })}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isDeleteOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isDeleting) {
                setIsDeleteOpen(false)
              }
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-bingo-title"
              aria-describedby="delete-bingo-description"
              className="bg-card border-border flex w-full max-w-md flex-col gap-4 rounded-xl border p-5 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Trash2 className="size-5" />
                </div>
                <h2 id="delete-bingo-title" className="text-lg font-semibold">
                  {t('bingos.delete.title')}
                </h2>
              </div>

              <p
                id="delete-bingo-description"
                className="text-muted-foreground text-sm"
              >
                {t('bingos.delete.description', { name: bingo.name })}
              </p>
              <p className="text-muted-foreground text-sm">
                {t('bingos.delete.cardsPreserved')}
              </p>

              {deleteError && (
                <p role="alert" className="text-destructive text-sm">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isDeleting}
                  className="border-border hover:bg-accent flex-1 cursor-pointer rounded-lg border px-4 py-3 text-sm font-medium disabled:opacity-50"
                >
                  {t('bingos.new.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBingo}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground flex-1 cursor-pointer rounded-lg px-4 py-3 text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  {isDeleting
                    ? t('bingos.delete.deleting')
                    : t('bingos.delete.confirm')}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

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
                  className="bg-primary text-primary-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm disabled:opacity-50"
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
