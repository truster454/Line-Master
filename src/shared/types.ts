export type PositionSource = 'chess.com' | 'lichess' | 'unknown'
export type SideColor = 'w' | 'b'
export type RatingRange = '0-700' | '700-1000' | '1000-1300' | '1300-1600' | '1600-2000' | '2000+'

export interface PositionSnapshot {
  source: PositionSource
  fen?: string
  moves: string[]
  playerColor?: SideColor
  url?: string
}

export interface TheoreticalMove {
  uci: string
  totalWeight: number
  booksCount: number
  favoriteBooksCount: number
  openingIds: string[]
}

export type PerformanceMode = 'standard' | 'economy'

export interface PositionInsight {
  snapshot: PositionSnapshot | null
  openingId?: string
  openingName?: string
  openingEco?: string
  bookMoveUci?: string
  favoriteBookMoveUci?: string
  theoreticalMoves: TheoreticalMove[]
  matchedBooks: number
  hintsEnabled: boolean
  performanceMode: PerformanceMode
  bookStatus:
    | 'position-not-detected'
    | 'fen-missing'
    | 'book-not-found'
    | 'move-found'
    | 'move-not-found'
    | 'book-load-error'
    | 'depth-limit'
    | 'not-player-turn'
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
