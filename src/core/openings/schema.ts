export type RatingBand = 'beginner' | 'intermediate' | 'advanced' | 'master'
export type OpeningType = 'open' | 'semi-open' | 'closed' | 'semi-closed' | 'flank'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Opening {
  id: string
  name: string
  eco?: string
  moves: string[]
  tags?: string[]
  type?: OpeningType
  difficulty?: Difficulty
  ratingBand?: RatingBand
}

export interface OpeningsFilters {
  ratingBand?: RatingBand
  types?: OpeningType[]
  difficulties?: Difficulty[]
  tags?: string[]
}
