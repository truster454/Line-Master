type PieceLetter = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

interface BoardPiece {
  square: string
  symbol: string
}

function fileCharToIndex(file: string): number {
  return file.charCodeAt(0) - 97
}

function squareToCoords(square: string): { file: number; rank: number } | null {
  if (!/^[a-h][1-8]$/.test(square)) {
    return null
  }
  return {
    file: fileCharToIndex(square[0]),
    rank: Number(square[1]) - 1
  }
}

function inferCastling(board: Array<Array<string | null>>): string {
  let rights = ''
  if (board[0][4] === 'K' && board[0][7] === 'R') {
    rights += 'K'
  }
  if (board[0][4] === 'K' && board[0][0] === 'R') {
    rights += 'Q'
  }
  if (board[7][4] === 'k' && board[7][7] === 'r') {
    rights += 'k'
  }
  if (board[7][4] === 'k' && board[7][0] === 'r') {
    rights += 'q'
  }
  return rights || '-'
}

function boardToFen(pieces: BoardPiece[], moveCount: number): string | null {
  const board: Array<Array<string | null>> = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null))

  for (const piece of pieces) {
    const coords = squareToCoords(piece.square)
    if (!coords) {
      continue
    }
    board[coords.rank][coords.file] = piece.symbol
  }

  const ranks: string[] = []
  for (let rank = 7; rank >= 0; rank -= 1) {
    let empty = 0
    let row = ''
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file]
      if (!piece) {
        empty += 1
        continue
      }
      if (empty > 0) {
        row += String(empty)
        empty = 0
      }
      row += piece
    }
    if (empty > 0) {
      row += String(empty)
    }
    ranks.push(row)
  }

  if (ranks.join('') === '8'.repeat(8)) {
    return null
  }

  const activeColor = moveCount % 2 === 0 ? 'w' : 'b'
  const castling = inferCastling(board)
  return `${ranks.join('/')} ${activeColor} ${castling} - 0 1`
}

function parseChessComPieceSymbol(className: string, dataPiece?: string | null): string | null {
  const source = `${className} ${dataPiece ?? ''}`
  const codeMatch = source.match(/\b([wb])([pnbrqk])\b/i)
  if (!codeMatch) {
    return null
  }
  const color = codeMatch[1].toLowerCase()
  const letter = codeMatch[2].toLowerCase() as PieceLetter
  return color === 'w' ? letter.toUpperCase() : letter
}

function parseChessComSquare(className: string, dataSquare?: string | null): string | null {
  if (dataSquare && /^[a-h][1-8]$/.test(dataSquare)) {
    return dataSquare
  }

  const coordMatch = className.match(/\b([a-h][1-8])\b/)
  if (coordMatch) {
    return coordMatch[1]
  }

  const squareMatch = className.match(/square-([1-8])([1-8])/)
  if (!squareMatch) {
    return null
  }

  const file = Number(squareMatch[1])
  const rank = Number(squareMatch[2])
  return `${String.fromCharCode(96 + file)}${rank}`
}

export function buildFenFromChessComBoard(moveCount: number): string | undefined {
  const pieceNodes = Array.from(document.querySelectorAll<HTMLElement>('.piece, [data-piece], [class*=" square-"]'))

  const pieces: BoardPiece[] = []
  for (const node of pieceNodes) {
    const className = node.className ?? ''
    const symbol = parseChessComPieceSymbol(className, node.getAttribute('data-piece'))
    const square = parseChessComSquare(className, node.getAttribute('data-square'))
    if (!symbol || !square) {
      continue
    }
    pieces.push({ square, symbol })
  }

  const fen = boardToFen(pieces, moveCount)
  return fen ?? undefined
}

function parseLichessPieceSymbol(className: string): string | null {
  const colorMatch = className.match(/\b(white|black)\b/)
  const roleMatch = className.match(/\b(pawn|knight|bishop|rook|queen|king)\b/)
  if (!colorMatch || !roleMatch) {
    return null
  }

  const roleToLetter: Record<string, PieceLetter> = {
    pawn: 'p',
    knight: 'n',
    bishop: 'b',
    rook: 'r',
    queen: 'q',
    king: 'k'
  }

  const letter = roleToLetter[roleMatch[1]]
  return colorMatch[1] === 'white' ? letter.toUpperCase() : letter
}

function parseLichessSquare(className: string): string | null {
  const squareMatch = className.match(/\b([a-h][1-8])\b/)
  return squareMatch ? squareMatch[1] : null
}

export function buildFenFromLichessBoard(moveCount: number): string | undefined {
  const pieceNodes = Array.from(document.querySelectorAll<HTMLElement>('cg-board piece, piece'))
  const pieces: BoardPiece[] = []

  for (const node of pieceNodes) {
    const className = node.className ?? ''
    const symbol = parseLichessPieceSymbol(className)
    const square = parseLichessSquare(className)
    if (!symbol || !square) {
      continue
    }
    pieces.push({ square, symbol })
  }

  const fen = boardToFen(pieces, moveCount)
  return fen ?? undefined
}
