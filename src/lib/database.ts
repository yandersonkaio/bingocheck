import Dexie, { type EntityTable } from 'dexie'

export interface BingoCard {
  id: string
  name: string
  numbers: (number | null)[]
  createdAt: Date
  updatedAt: Date
}

const db = new Dexie('BingoCheck') as Dexie & {
  cards: EntityTable<BingoCard, 'id'>
}

db.version(1).stores({
  cards: 'id, name, createdAt, updatedAt',
})

export { db }
