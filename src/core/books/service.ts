import booksIndexData from '../../data/books.index.json'
import type { Opening } from '../openings/schema'
import { POLYGLOT_RANDOM } from './polyglot-random'

type BooksIndex = Record<string, string>

type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

interface ParsedFen {
  board: Array<Piece | null>
  activeColor: 'w' | 'b'
  castling: string
  enPassant: string
}

export interface BookInfo {
  id: string
  path: string
}

export interface LoadedBook {
  id: string
  path: string
  bytes: ArrayBuffer
  entriesCount: number
}

export interface BookMove {
  uci: string
  weight: number
  learn: number
  rawMove: number
}

export interface BookLookupResult {
  key: string
  total: number
  best: BookMove
  candidates: BookMove[]
}

export interface BookLookupHit {
  openingId: string
  path: string
  lookup: BookLookupResult
}

const BOOK_ENTRY_SIZE = 16
// Polyglot piece ordering follows python-chess/chess-polyglot:
// black, white for each piece type (pawn, knight, bishop, rook, queen, king).
const PIECE_TO_INDEX: Record<Piece, number> = {
  p: 0,
  P: 1,
  n: 2,
  N: 3,
  b: 4,
  B: 5,
  r: 6,
  R: 7,
  q: 8,
  Q: 9,
  k: 10,
  K: 11
}

const booksIndex = booksIndexData as BooksIndex

function normalizeBookKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function entriesCountFromBuffer(buffer: ArrayBuffer): number {
  return Math.floor(buffer.byteLength / BOOK_ENTRY_SIZE)
}

function fileToIndex(file: string): number {
  return file.charCodeAt(0) - 97
}

function squareToUci(square: number): string {
  const file = String.fromCharCode(97 + (square % 8))
  const rank = String(Math.floor(square / 8) + 1)
  return `${file}${rank}`
}

function decodePolyglotMove(move: number): string {
  const toFile = move & 0b111
  const toRank = (move >> 3) & 0b111
  const fromFile = (move >> 6) & 0b111
  const fromRank = (move >> 9) & 0b111
  const promotion = (move >> 12) & 0b111

  let from = fromRank * 8 + fromFile
  let to = toRank * 8 + toFile

  // Polyglot stores castling as king captures rook squares.
  if (from === 4 && to === 7) {
    to = 6
  } else if (from === 4 && to === 0) {
    to = 2
  } else if (from === 60 && to === 63) {
    to = 62
  } else if (from === 60 && to === 56) {
    to = 58
  }

  const promotionChar = promotion === 1 ? 'n' : promotion === 2 ? 'b' : promotion === 3 ? 'r' : promotion === 4 ? 'q' : ''

  return `${squareToUci(from)}${squareToUci(to)}${promotionChar}`
}

function parseFen(fen: string): ParsedFen | null {
  const parts = fen.trim().split(/\s+/)
  if (parts.length < 4) {
    return null
  }

  const [placement, activeColor, castling, enPassant] = parts
  if (activeColor !== 'w' && activeColor !== 'b') {
    return null
  }

  const board: Array<Piece | null> = Array.from({ length: 64 }, () => null)
  const rows = placement.split('/')
  if (rows.length !== 8) {
    return null
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    let file = 0
    for (const symbol of row) {
      if (symbol >= '1' && symbol <= '8') {
        file += Number(symbol)
        continue
      }

      if (!(symbol in PIECE_TO_INDEX)) {
        return null
      }

      const rankFromWhite = 7 - rowIndex
      const square = rankFromWhite * 8 + file
      board[square] = symbol as Piece
      file += 1
    }

    if (file !== 8) {
      return null
    }
  }

  return {
    board,
    activeColor,
    castling,
    enPassant
  }
}

function hasPawnForEpCapture(board: Array<Piece | null>, activeColor: 'w' | 'b', epSquare: number): boolean {
  const file = epSquare % 8
  const rank = Math.floor(epSquare / 8)

  if (activeColor === 'w') {
    if (rank !== 5) {
      return false
    }
    const left = file > 0 ? board[4 * 8 + (file - 1)] : null
    const right = file < 7 ? board[4 * 8 + (file + 1)] : null
    return left === 'P' || right === 'P'
  }

  if (rank !== 2) {
    return false
  }
  const left = file > 0 ? board[3 * 8 + (file - 1)] : null
  const right = file < 7 ? board[3 * 8 + (file + 1)] : null
  return left === 'p' || right === 'p'
}

function computePolyglotKey(parsedFen: ParsedFen): bigint {
  let key = 0n

  for (let square = 0; square < parsedFen.board.length; square += 1) {
    const piece = parsedFen.board[square]
    if (!piece) {
      continue
    }
    const pieceOffset = PIECE_TO_INDEX[piece] * 64
    key ^= POLYGLOT_RANDOM[pieceOffset + square]
  }

  if (parsedFen.castling.includes('K')) {
    key ^= POLYGLOT_RANDOM[768]
  }
  if (parsedFen.castling.includes('Q')) {
    key ^= POLYGLOT_RANDOM[769]
  }
  if (parsedFen.castling.includes('k')) {
    key ^= POLYGLOT_RANDOM[770]
  }
  if (parsedFen.castling.includes('q')) {
    key ^= POLYGLOT_RANDOM[771]
  }

  if (parsedFen.enPassant !== '-' && parsedFen.enPassant.length === 2) {
    const file = fileToIndex(parsedFen.enPassant[0])
    const rank = Number(parsedFen.enPassant[1])
    if (file >= 0 && file < 8 && rank >= 1 && rank <= 8) {
      const epSquare = (rank - 1) * 8 + file
      if (hasPawnForEpCapture(parsedFen.board, parsedFen.activeColor, epSquare)) {
        key ^= POLYGLOT_RANDOM[772 + file]
      }
    }
  }

  if (parsedFen.activeColor === 'w') {
    key ^= POLYGLOT_RANDOM[780]
  }

  return key
}

function lowerBound(view: DataView, entriesCount: number, targetKey: bigint): number {
  let left = 0
  let right = entriesCount

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const midKey = view.getBigUint64(mid * BOOK_ENTRY_SIZE, false)
    if (midKey < targetKey) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  return left
}

function readMovesForKey(book: LoadedBook, targetKey: bigint): BookMove[] {
  const view = new DataView(book.bytes)
  const start = lowerBound(view, book.entriesCount, targetKey)
  if (start >= book.entriesCount) {
    return []
  }

  const moves: BookMove[] = []
  for (let index = start; index < book.entriesCount; index += 1) {
    const offset = index * BOOK_ENTRY_SIZE
    const key = view.getBigUint64(offset, false)
    if (key !== targetKey) {
      break
    }

    const rawMove = view.getUint16(offset + 8, false)
    const weight = view.getUint16(offset + 10, false)
    const learn = view.getUint32(offset + 12, false)

    moves.push({
      uci: decodePolyglotMove(rawMove),
      weight,
      learn,
      rawMove
    })
  }

  return moves
}

export class BookService {
  private readonly loadCache = new Map<string, Promise<LoadedBook | null>>()

  listBooks(): BookInfo[] {
    return Object.entries(booksIndex).map(([id, path]) => ({ id, path }))
  }

  resolveBookPath(openingId: string): string | null {
    const normalized = normalizeBookKey(openingId)
    return booksIndex[normalized] ?? null
  }

  resolveBookPathForOpening(opening: Opening): string | null {
    const byId = this.resolveBookPath(opening.id)
    if (byId) {
      return byId
    }
    return this.resolveBookPath(opening.name)
  }

  hasBookForOpening(opening: Opening): boolean {
    return this.resolveBookPathForOpening(opening) !== null
  }

  async loadBookByOpeningId(openingId: string): Promise<LoadedBook | null> {
    const path = this.resolveBookPath(openingId)
    if (!path) {
      return null
    }
    return this.loadBookByPath(openingId, path)
  }

  async loadBookForOpening(opening: Opening): Promise<LoadedBook | null> {
    const path = this.resolveBookPathForOpening(opening)
    if (!path) {
      return null
    }
    return this.loadBookByPath(opening.id, path)
  }

  polyglotKeyFromFen(fen: string): bigint | null {
    const parsed = parseFen(fen)
    if (!parsed) {
      return null
    }
    return computePolyglotKey(parsed)
  }

  lookupByKey(book: LoadedBook, key: bigint): BookLookupResult | null {
    const candidates = readMovesForKey(book, key)
    if (candidates.length === 0) {
      return null
    }

    const best = [...candidates].sort((a, b) => b.weight - a.weight)[0]
    return {
      key: `0x${key.toString(16).padStart(16, '0')}`,
      total: candidates.length,
      best,
      candidates
    }
  }

  lookupByFen(book: LoadedBook, fen: string): BookLookupResult | null {
    const key = this.polyglotKeyFromFen(fen)
    if (key === null) {
      return null
    }
    return this.lookupByKey(book, key)
  }

  async lookupAllByFen(fen: string): Promise<BookLookupHit[]> {
    const key = this.polyglotKeyFromFen(fen)
    if (key === null) {
      return []
    }

    const hits: BookLookupHit[] = []
    const books = this.listBooks()

    await Promise.all(
      books.map(async ({ id, path }) => {
        const loaded = await this.loadBookByPath(id, path)
        if (!loaded) {
          return
        }
        const lookup = this.lookupByKey(loaded, key)
        if (!lookup) {
          return
        }
        hits.push({
          openingId: id,
          path,
          lookup
        })
      })
    )

    return hits.sort((a, b) => b.lookup.best.weight - a.lookup.best.weight)
  }

  private loadBookByPath(openingId: string, path: string): Promise<LoadedBook | null> {
    const cacheKey = `${openingId}:${path}`
    const cached = this.loadCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const task = (async (): Promise<LoadedBook | null> => {
      const runtime = globalThis.chrome?.runtime
      const url = runtime?.getURL ? runtime.getURL(path) : path
      const response = await fetch(url)
      if (!response.ok) {
        return null
      }
      const bytes = await response.arrayBuffer()
      return {
        id: normalizeBookKey(openingId),
        path,
        entriesCount: entriesCountFromBuffer(bytes),
        bytes
      }
    })()

    this.loadCache.set(cacheKey, task)
    return task
  }
}
