const RESULT_TOKENS = new Set(['1-0', '0-1', '1/2-1/2', '*'])

export function normalizeMoveList(moves: string[]): string[] {
  return moves
    .map((move) => move.trim())
    .map((move) => move.replace(/^\d+\.(\.\.)?/, ''))
    .map((move) => move.replace(/^[.]+/, ''))
    .map((move) => move.replace(/[!?+#]+$/g, ''))
    .map((move) => move.replace(/0-0-0/g, 'O-O-O').replace(/0-0/g, 'O-O'))
    .filter((move) => move.length > 0)
    .filter((move) => !RESULT_TOKENS.has(move))
}
