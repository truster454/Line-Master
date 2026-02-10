import type { Opening } from './schema'

export interface RecommendationResult {
  opening: Opening
  score: number
  depth: number
}

export function rankByMovePrefix(openings: Opening[], moves: string[]): RecommendationResult[] {
  if (moves.length === 0) {
    return []
  }

  return openings
    .map((opening) => {
      const depth = moves.reduce((count, move, index) => {
        if (opening.moves[index] === move) {
          return count + 1
        }
        return count
      }, 0)
      return {
        opening,
        depth,
        score: depth * 10 + opening.moves.length
      }
    })
    .filter((result) => result.depth > 0)
    .sort((a, b) => b.score - a.score)
}
