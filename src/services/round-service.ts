import { findRoundWinners } from '@/lib/bingo-winners'
import {
  type BingoCard,
  type BingoRound,
  db,
  type RoundRule,
} from '@/lib/database'

interface CreateRoundData {
  bingoId: string
  rules: RoundRule[]
}

const VALID_RULES: RoundRule[] = ['line', 'column', 'diagonal', 'full_card']

export async function createRound({
  bingoId,
  rules,
}: CreateRoundData): Promise<string> {
  const uniqueRules = [...new Set(rules)]

  if (
    uniqueRules.length === 0 ||
    uniqueRules.some((rule) => !VALID_RULES.includes(rule))
  ) {
    throw new Error('Invalid round rules')
  }

  return db.transaction('rw', db.bingos, db.rounds, db.cards, async () => {
    const bingo = await db.bingos.get(bingoId)

    if (!bingo) throw new Error('Bingo not found')
    if (bingo.status === 'finished') {
      throw new Error('Cannot create a round in a finished bingo')
    }
    if (bingo.cardIds.length === 0) {
      throw new Error('At least one card must be linked to start a round')
    }

    const linkedCards = await db.cards.bulkGet(bingo.cardIds)
    const validCards = linkedCards.filter(
      (card): card is BingoCard => card !== undefined,
    )

    if (validCards.length === 0) {
      throw new Error('No valid cards are linked to this bingo')
    }

    const rounds = await db.rounds.where('bingoId').equals(bingoId).toArray()
    if (rounds.some((round) => round.status === 'in_progress')) {
      throw new Error('A round is already in progress')
    }

    const nextNumber =
      rounds.reduce((max, round) => Math.max(max, round.number), 0) + 1
    const now = new Date()

    // Copy the entire card, including its numbers, into the new round.
    const snapshot = validCards.map((card) => ({
      id: card.id,
      name: card.name,
      numbers: [...card.numbers],
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt),
    }))

    const round: BingoRound = {
      id: crypto.randomUUID(),
      bingoId,
      number: nextNumber,
      rules: uniqueRules,
      drawnNumbers: [],
      cards: snapshot,
      winners: [],
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
    }

    await db.rounds.add(round)
    await db.bingos.update(bingoId, {
      status: 'in_progress',
      updatedAt: now,
    })

    return round.id
  })
}

export async function updateRoundRules(
  roundId: string,
  rules: RoundRule[],
): Promise<void> {
  const uniqueRules = [...new Set(rules)]

  if (
    uniqueRules.length === 0 ||
    uniqueRules.some((rule) => !VALID_RULES.includes(rule))
  ) {
    throw new Error('Invalid round rules')
  }

  await db.transaction('rw', db.rounds, db.bingos, async () => {
    const round = await db.rounds.get(roundId)
    if (!round || round.status !== 'in_progress') {
      throw new Error('Round is not in progress')
    }

    const bingo = await db.bingos.get(round.bingoId)
    if (!bingo || bingo.status === 'finished') {
      throw new Error('Bingo is not available')
    }

    await db.rounds.update(roundId, {
      rules: uniqueRules,
      updatedAt: new Date(),
    })
  })
}

export async function registerDrawnNumber(
  roundId: string,
  number: number,
): Promise<void> {
  if (!Number.isInteger(number) || number < 1 || number > 75) {
    throw new Error('Invalid bingo number')
  }

  await db.transaction('rw', db.rounds, async () => {
    const round = await db.rounds.get(roundId)
    if (!round || round.status !== 'in_progress') {
      throw new Error('Round is not in progress')
    }
    if (round.drawnNumbers.includes(number)) return

    await db.rounds.update(roundId, {
      drawnNumbers: [...round.drawnNumbers, number],
      updatedAt: new Date(),
    })
  })
}

export async function undoLastDrawnNumber(roundId: string): Promise<void> {
  await db.transaction('rw', db.rounds, async () => {
    const round = await db.rounds.get(roundId)
    if (!round || round.status !== 'in_progress') {
      throw new Error('Round is not in progress')
    }
    if (round.drawnNumbers.length === 0) return

    await db.rounds.update(roundId, {
      drawnNumbers: round.drawnNumbers.slice(0, -1),
      updatedAt: new Date(),
    })
  })
}

export async function finishRound(roundId: string): Promise<void> {
  await db.transaction('rw', db.rounds, db.bingos, db.cards, async () => {
    const round = await db.rounds.get(roundId)
    if (!round || round.status !== 'in_progress') {
      throw new Error('Round is not in progress')
    }

    const bingo = await db.bingos.get(round.bingoId)
    if (!bingo || bingo.status === 'finished') {
      throw new Error('Bingo is not available')
    }

    // New rounds always use their immutable snapshot. Old rounds without
    // snapshots retain the previous behavior so they can still be finished.
    let cards: BingoCard[]
    if (round.cards !== undefined) {
      cards = round.cards
    } else {
      const results = await db.cards.bulkGet(bingo.cardIds)
      cards = results.filter((card): card is BingoCard => card !== undefined)
    }

    const winners = findRoundWinners(cards, round.drawnNumbers, round.rules)
    const now = new Date()

    await db.rounds.update(roundId, {
      status: 'finished',
      winners,
      finishedAt: now,
      updatedAt: now,
    })

    await db.bingos.update(round.bingoId, { updatedAt: now })
  })
}
