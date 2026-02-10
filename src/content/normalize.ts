export function normalizeMoveList(moves: string[]): string[] {
  return moves.map((move) => move.trim()).filter(Boolean)
}
