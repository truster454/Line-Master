import type { PositionSnapshot } from '../../shared/types'
import { normalizeMoveList } from '../normalize'
import { buildFenFromLichessBoard } from '../fen-from-board'
import { isValidFen } from '../fen-utils'

const FEN_PATTERN = /([pnbrqkPNBRQK1-8]{1,8}(?:\/[pnbrqkPNBRQK1-8]{1,8}){7}\s[wb]\s(?:K?Q?k?q?|-)\s(?:[a-h][36]|-)\s\d+\s\d+)/
const SCRIPT_SCAN_INTERVAL_MS = 5000

let lastScriptScanAt = 0
let cachedScriptFen: string | undefined
let cachedHref = ''

function extractFenFromText(text: string): string | null {
  const match = text.match(FEN_PATTERN)
  if (!match) {
    return null
  }
  return isValidFen(match[1]) ? match[1] : null
}

function extractFenFromDom(): string | undefined {
  if (cachedHref !== window.location.href) {
    cachedHref = window.location.href
    cachedScriptFen = undefined
    lastScriptScanAt = 0
  }

  const attrSelectors = ['cg-board', '[data-fen]', '.analyse__board']
  for (const selector of attrSelectors) {
    const node = document.querySelector<HTMLElement>(selector)
    const fen = node?.getAttribute('fen') ?? node?.getAttribute('data-fen')
    if (fen && extractFenFromText(fen)) {
      return fen
    }
  }

  const now = Date.now()
  if (now - lastScriptScanAt < SCRIPT_SCAN_INTERVAL_MS) {
    return cachedScriptFen
  }
  lastScriptScanAt = now

  const scripts = Array.from(document.querySelectorAll('script:not([src])')).slice(0, 80)
  for (const script of scripts) {
    const text = script.textContent
    if (!text || !text.includes('fen')) {
      continue
    }
    const fen = extractFenFromText(text)
    if (fen) {
      cachedScriptFen = fen
      return fen
    }
  }

  cachedScriptFen = undefined
  return undefined
}

function extractMovesFromDom(): string[] {
  const selectors = [
    '.analyse__moves move',
    '.game__moves move',
    '.rmoves move',
    '.moves .move'
  ]

  const rawMoves: string[] = []
  for (const selector of selectors) {
    const elements = document.querySelectorAll<HTMLElement>(selector)
    if (elements.length === 0) {
      continue
    }
    for (const element of elements) {
      const text = element.textContent?.trim()
      if (text) {
        rawMoves.push(text)
      }
    }
    if (rawMoves.length > 0) {
      break
    }
  }

  return normalizeMoveList(rawMoves)
}

function detectPlayerColor(): 'w' | 'b' | undefined {
  const board = document.querySelector<HTMLElement>('cg-board')
  if (!board) {
    return undefined
  }
  const isBlack = Boolean(board.closest('.orientation-black'))
  return isBlack ? 'b' : 'w'
}

export async function detectLichess(): Promise<PositionSnapshot | null> {
  const moves = extractMovesFromDom()
  const domFen = extractFenFromDom()
  const boardFen = domFen ? undefined : buildFenFromLichessBoard(moves.length)
  const fen = domFen ?? (boardFen && isValidFen(boardFen) ? boardFen : undefined)

  if (moves.length === 0 && !fen) {
    return null
  }

  return {
    source: 'lichess',
    fen,
    moves,
    playerColor: detectPlayerColor(),
    url: window.location.href
  }
}
