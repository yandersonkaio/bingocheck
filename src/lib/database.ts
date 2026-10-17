import Dexie, { type EntityTable } from 'dexie'

export interface BingoCard {
  id: string
  name: string
  numbers: (number | null)[]
  createdAt: Date
  updatedAt: Date
}

export type BingoStatus = 'not_started' | 'in_progress' | 'finished'

export interface Bingo {
  id: string
  name: string
  date: string | null
  cardIds: string[]
  status: BingoStatus
  createdAt: Date
  updatedAt: Date
}

export type RoundRule = 'line' | 'column' | 'diagonal' | 'full_card'
export type RoundStatus = 'in_progress' | 'finished'

export interface BingoRound {
  id: string
  bingoId: string
  number: number
  rules: RoundRule[]
  drawnNumbers: number[]
  status: RoundStatus
  cards?: BingoCard[]
  winners?: {
    cardId: string
    cardName: string
    rules: RoundRule[]
  }[]
  createdAt: Date
  updatedAt: Date
  finishedAt: Date | null
}

const db = new Dexie('BingoCheck') as Dexie & {
  cards: EntityTable<BingoCard, 'id'>
  bingos: EntityTable<Bingo, 'id'>
  rounds: EntityTable<BingoRound, 'id'>
}

db.version(1).stores({
  cards: 'id, name, createdAt, updatedAt',
})

db.version(2).stores({
  cards: 'id, name, createdAt, updatedAt',
  bingos: 'id, name, date, status, createdAt, updatedAt',
})

db.version(3).stores({
  cards: 'id, name, createdAt, updatedAt',
  bingos: 'id, name, date, status, createdAt, updatedAt',
  rounds: 'id, bingoId, number, status, createdAt',
})

export { db }
