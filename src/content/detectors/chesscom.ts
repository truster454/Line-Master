import type { PositionSnapshot } from '../../shared/types'
import { normalizeMoveList } from '../normalize'
import { buildFenFromChessComBoard } from '../fen-from-board'
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

  const attrSelectors = [
    '[data-fen]',
    'chess-board[data-fen]',
    'wc-chess-board[data-fen]',
    '[data-board-fen]'
  ]

  for (const selector of attrSelectors) {
    const node = document.querySelector<HTMLElement>(selector)
    const fen = node?.getAttribute('data-fen') ?? node?.getAttribute('data-board-fen')
    if (fen && extractFenFromText(fen)) {
      return fen
    }
  }

  const now = Date.now()
  if (now - lastScriptScanAt < SCRIPT_SCAN_INTERVAL_MS) {
    return cachedScriptFen
  }
  lastScriptScanAt = now

  const scripts = Array.from(document.querySelectorAll('script:not([src])')).slice(0, 60)
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
    '[data-cy="move-list"] .move-text-component',
    '.move-text-component',
    '.vertical-move-list-component .node',
    '.move-list-row .node'
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
  const board =
    document.querySelector<HTMLElement>('wc-chess-board') ??
    document.querySelector<HTMLElement>('chess-board') ??
    document.querySelector<HTMLElement>('[data-cy="board-layout-board"] .board') ??
    document.querySelector<HTMLElement>('.board')

  if (!board) {
    return undefined
  }

  const flipped = Boolean(
    board.classList.contains('flipped') ||
      board.closest('.flipped') ||
      document.querySelector('.board.flipped') ||
      document.querySelector('chess-board.flipped')
  )

  return flipped ? 'b' : 'w'
}

export async function detectChessCom(): Promise<PositionSnapshot | null> {
  const moves = extractMovesFromDom()
  const domFen = extractFenFromDom()
  const boardFen = domFen ? undefined : buildFenFromChessComBoard(moves.length)
  const fen = domFen ?? (boardFen && isValidFen(boardFen) ? boardFen : undefined)

  if (moves.length === 0 && !fen) {
    return null
  }

  return {
    source: 'chess.com',
    fen,
    moves,
    playerColor: detectPlayerColor(),
    url: window.location.href
  }
}
