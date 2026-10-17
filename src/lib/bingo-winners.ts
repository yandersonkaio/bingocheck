import { type BingoCard, type RoundRule } from '@/lib/database'

export interface RoundWinner {
  cardId: string
  cardName: string
  rules: RoundRule[]
}

const linePatterns = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 5 }, (_, column) => row * 5 + column),
)

const columnPatterns = Array.from({ length: 5 }, (_, column) =>
  Array.from({ length: 5 }, (_, row) => row * 5 + column),
)

const diagonalPatterns = [
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

const fullCardPattern = [Array.from({ length: 25 }, (_, index) => index)]

const patternsByRule: Record<RoundRule, number[][]> = {
  line: linePatterns,
  column: columnPatterns,
  diagonal: diagonalPatterns,
  full_card: fullCardPattern,
}

export function findRoundWinners(
  cards: BingoCard[],
  drawnNumbers: number[],
  rules: RoundRule[],
): RoundWinner[] {
  const drawnSet = new Set(drawnNumbers)

  return cards.flatMap((card) => {
    const winningRules = rules.filter((rule) =>
      patternsByRule[rule].some((pattern) =>
        pattern.every((index) => {
          const number = card.numbers[index]

          return number === null || drawnSet.has(number)
        }),
      ),
    )

    if (winningRules.length === 0) {
      return []
    }

    return [
      {
        cardId: card.id,
        cardName: card.name,
        rules: winningRules,
      },
    ]
  })
}
