import { type BingoCard, db } from '@/lib/database'

const FREE_POSITION = 12
const TOTAL_POSITIONS = 25

function validateCard(
  name: string,
  numbers: (number | null)[],
  freeCenter: boolean,
) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    throw new Error('Card name is required')
  }

  if (numbers.length !== TOTAL_POSITIONS) {
    throw new Error('Invalid card structure')
  }

  if (freeCenter && numbers[FREE_POSITION] !== null) {
    throw new Error('Free center must be empty')
  }

  const selectedNumbers = numbers.filter(
    (number): number is number => number !== null,
  )

  const expectedNumbers = freeCenter ? 24 : 25

  if (selectedNumbers.length !== expectedNumbers) {
    throw new Error(`Card must contain ${expectedNumbers} numbers`)
  }

  if (new Set(selectedNumbers).size !== expectedNumbers) {
    throw new Error('Card contains duplicate numbers')
  }

  const hasInvalidNumber = numbers.some((number, position) => {
    if (position === FREE_POSITION && freeCenter) return false

    if (number === null || !Number.isInteger(number)) return true

    const columnIndex = position % 5
    const min = columnIndex * 15 + 1
    const max = min + 14

    return number < min || number > max
  })

  if (hasInvalidNumber) {
    throw new Error('Card contains invalid numbers')
  }

  return normalizedName
}

export async function createCard(
  name: string,
  numbers: (number | null)[],
  freeCenter = true,
): Promise<string> {
  const normalizedName = validateCard(name, numbers, freeCenter)
  const now = new Date()

  const card: BingoCard = {
    id: crypto.randomUUID(),
    name: normalizedName,
    numbers: [...numbers],
    freeCenter,
    createdAt: now,
    updatedAt: now,
  }

  await db.cards.add(card)

  return card.id
}

export async function updateCard(
  id: string,
  name: string,
  numbers: (number | null)[],
  freeCenter = true,
): Promise<void> {
  const normalizedName = validateCard(name, numbers, freeCenter)

  const updated = await db.cards.update(id, {
    name: normalizedName,
    numbers: [...numbers],
    freeCenter,
    updatedAt: new Date(),
  })

  if (updated === 0) {
    throw new Error('Card not found')
  }
}

export async function duplicateCard(id: string): Promise<string> {
  const original = await db.cards.get(id)

  if (!original) {
    throw new Error('Card not found')
  }

  return createCard(
    `${original.name} (copy)`,
    original.numbers,
    original.freeCenter ?? true,
  )
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.delete(id)
}
