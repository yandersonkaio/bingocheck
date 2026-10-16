import { type BingoCard, db } from '@/lib/database'

const FREE_POSITION = 12
const TOTAL_POSITIONS = 25
const TOTAL_NUMBERS = 24

function validateCard(name: string, numbers: (number | null)[]) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    throw new Error('Card name is required')
  }

  if (numbers.length !== TOTAL_POSITIONS || numbers[FREE_POSITION] !== null) {
    throw new Error('Invalid card structure')
  }

  const selectedNumbers = numbers.filter(
    (number): number is number => number !== null,
  )

  if (selectedNumbers.length !== TOTAL_NUMBERS) {
    throw new Error('Card must contain 24 numbers')
  }

  if (new Set(selectedNumbers).size !== TOTAL_NUMBERS) {
    throw new Error('Card contains duplicate numbers')
  }

  const hasInvalidNumber = numbers.some((number, position) => {
    if (position === FREE_POSITION) return false

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
): Promise<string> {
  const normalizedName = validateCard(name, numbers)
  const now = new Date()

  const card: BingoCard = {
    id: crypto.randomUUID(),
    name: normalizedName,
    numbers: [...numbers],
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
): Promise<void> {
  const normalizedName = validateCard(name, numbers)

  const updated = await db.cards.update(id, {
    name: normalizedName,
    numbers: [...numbers],
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

  return createCard(`${original.name} (copy)`, original.numbers)
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.delete(id)
}
