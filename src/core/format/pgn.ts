export function normalizeMoves(moves: string[]): string[] {
  return moves
    .map((move) => move.replace(/\d+\./g, '').trim())
    .filter((move) => move.length > 0)
}
