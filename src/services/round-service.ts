import { findRoundWinners } from '@/lib/bingo-winners'
import { type BingoRound, db, type RoundRule } from '@/lib/database'

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

  return db.transaction('rw', db.bingos, db.rounds, async () => {
    const bingo = await db.bingos.get(bingoId)

    if (!bingo) {
      throw new Error('Bingo not found')
    }

    if (bingo.status === 'finished') {
      throw new Error('Cannot create a round in a finished bingo')
    }

    const rounds = await db.rounds.where('bingoId').equals(bingoId).toArray()

    if (rounds.some((round) => round.status === 'in_progress')) {
      throw new Error('A round is already in progress')
    }

    const nextNumber =
      rounds.reduce((max, round) => Math.max(max, round.number), 0) + 1

    const now = new Date()

    const round: BingoRound = {
      id: crypto.randomUUID(),
      bingoId,
      number: nextNumber,
      rules: uniqueRules,
      drawnNumbers: [],
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

    if (round.drawnNumbers.includes(number)) {
      return
    }

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

    if (round.drawnNumbers.length === 0) {
      return
    }

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

    const results = await db.cards.bulkGet(bingo.cardIds)

    const cards = results.filter(
      (card): card is NonNullable<typeof card> => card !== undefined,
    )

    const winners = findRoundWinners(cards, round.drawnNumbers, round.rules)

    const now = new Date()

    await db.rounds.update(roundId, {
      status: 'finished',
      winners,
      finishedAt: now,
      updatedAt: now,
    })

    await db.bingos.update(round.bingoId, {
      updatedAt: now,
    })
  })
}
