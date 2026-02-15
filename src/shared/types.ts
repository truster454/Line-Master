export type PositionSource = 'chess.com' | 'lichess' | 'unknown'

export interface PositionSnapshot {
  source: PositionSource
  fen?: string
  moves: string[]
  url?: string
}

export interface TheoreticalMove {
  uci: string
  totalWeight: number
  booksCount: number
  openingIds: string[]
}

export interface PositionInsight {
  snapshot: PositionSnapshot | null
  openingId?: string
  openingName?: string
  openingEco?: string
  bookMoveUci?: string
  theoreticalMoves: TheoreticalMove[]
  matchedBooks: number
  hintsEnabled: boolean
  bookStatus: 'position-not-detected' | 'fen-missing' | 'book-not-found' | 'move-found' | 'move-not-found' | 'book-load-error'
  error?: string
  updatedAt: number
}

export interface Recommendation {
  openingId: string
  score: number
}

export interface UserSettings {
  ratingBand: string
  preferShortLines: boolean
}
