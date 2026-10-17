import { type Bingo, db } from '@/lib/database'

interface CreateBingoData {
  name: string
  date?: string | null
  cardIds?: string[]
}

export async function createBingo({
  name,
  date = null,
  cardIds = [],
}: CreateBingoData): Promise<string> {
  const normalizedName = name.trim()

  if (!normalizedName) {
    throw new Error('Bingo name is required')
  }

  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid bingo date')
  }

  const uniqueCardIds = [...new Set(cardIds)]
  const existingCards = await db.cards.bulkGet(uniqueCardIds)

  if (existingCards.some((card) => card === undefined)) {
    throw new Error('One or more cards do not exist')
  }

  const now = new Date()

  const bingo: Bingo = {
    id: crypto.randomUUID(),
    name: normalizedName,
    date,
    cardIds: uniqueCardIds,
    status: 'not_started',
    createdAt: now,
    updatedAt: now,
  }

  await db.bingos.add(bingo)

  return bingo.id
}

export async function updateBingoCards(
  bingoId: string,
  cardIds: string[],
): Promise<void> {
  const uniqueCardIds = [...new Set(cardIds)]

  await db.transaction('rw', db.bingos, db.rounds, db.cards, async () => {
    const bingo = await db.bingos.get(bingoId)

    if (!bingo) {
      throw new Error('Bingo not found')
    }

    if (bingo.status === 'finished') {
      throw new Error('Cannot edit cards in a finished bingo')
    }

    const rounds = await db.rounds.where('bingoId').equals(bingoId).toArray()

    if (rounds.some((round) => round.status === 'in_progress')) {
      throw new Error('Cannot edit cards while a round is in progress')
    }

    const existingCards = await db.cards.bulkGet(uniqueCardIds)

    if (existingCards.some((card) => card === undefined)) {
      throw new Error('One or more cards do not exist')
    }

    await db.bingos.update(bingoId, {
      cardIds: uniqueCardIds,
      updatedAt: new Date(),
    })
  })
}

export async function finishBingo(bingoId: string): Promise<void> {
  await db.transaction('rw', db.bingos, db.rounds, async () => {
    const bingo = await db.bingos.get(bingoId)

    if (!bingo) {
      throw new Error('Bingo not found')
    }

    if (bingo.status === 'finished') {
      throw new Error('Bingo is already finished')
    }

    const rounds = await db.rounds.where('bingoId').equals(bingoId).toArray()

    if (rounds.some((round) => round.status === 'in_progress')) {
      throw new Error('Cannot finish a bingo with an active round')
    }

    if (rounds.length === 0) {
      throw new Error('Cannot finish a bingo without rounds')
    }

    await db.bingos.update(bingoId, {
      status: 'finished',
      updatedAt: new Date(),
    })
  })
}

export async function reopenBingo(bingoId: string): Promise<void> {
  await db.transaction('rw', db.bingos, async () => {
    const bingo = await db.bingos.get(bingoId)

    if (!bingo) {
      throw new Error('Bingo not found')
    }

    if (bingo.status !== 'finished') {
      throw new Error('Bingo is not finished')
    }

    await db.bingos.update(bingoId, {
      status: 'in_progress',
      updatedAt: new Date(),
    })
  })
}
