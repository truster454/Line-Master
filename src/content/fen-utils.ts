export function isValidFen(fen: string): boolean {
  const parts = fen.trim().split(/\s+/)
  if (parts.length < 4) {
    return false
  }

  const [placement, activeColor, castling, enPassant] = parts
  if (activeColor !== 'w' && activeColor !== 'b') {
    return false
  }

  const rows = placement.split('/')
  if (rows.length !== 8) {
    return false
  }

  for (const row of rows) {
    let files = 0
    for (const symbol of row) {
      if (symbol >= '1' && symbol <= '8') {
        files += Number(symbol)
        continue
      }
      if (!/[pnbrqkPNBRQK]/.test(symbol)) {
        return false
      }
      files += 1
    }
    if (files !== 8) {
      return false
    }
  }

  if (castling !== '-' && !/^[KQkq]+$/.test(castling)) {
    return false
  }

  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) {
    return false
  }

  return true
}
