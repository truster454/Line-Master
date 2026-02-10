export type PositionSource = 'chess.com' | 'lichess' | 'unknown'

export interface PositionSnapshot {
  source: PositionSource
  fen?: string
  moves: string[]
  url?: string
}

export interface Recommendation {
  openingId: string
  score: number
}

export interface UserSettings {
  ratingBand: string
  preferShortLines: boolean
}
