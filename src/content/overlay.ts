import type { PositionInsight } from '../shared/types'

const OVERLAY_ID = 'line-master-board-overlay'

let lastMoves: string[] = []

function parseSquare(square: string): { file: number; rank: number } | null {
  if (!/^[a-h][1-8]$/.test(square)) {
    return null
  }
  return {
    file: square.charCodeAt(0) - 97,
    rank: Number(square[1])
  }
}

function parseUci(uci: string): { from: string; to: string } | null {
  if (!/^[a-h][1-8][a-h][1-8][nbrq]?$/.test(uci)) {
    return null
  }
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4)
  }
}

function getBoardElement(): HTMLElement | null {
  if (window.location.hostname.includes('chess.com')) {
    return (
      document.querySelector<HTMLElement>('wc-chess-board') ??
      document.querySelector<HTMLElement>('chess-board') ??
      document.querySelector<HTMLElement>('[data-cy="board-layout-board"] .board') ??
      document.querySelector<HTMLElement>('.board')
    )
  }

  if (window.location.hostname.includes('lichess.org')) {
    return document.querySelector<HTMLElement>('cg-board')
  }

  return null
}

function isFlipped(board: HTMLElement): boolean {
  if (window.location.hostname.includes('chess.com')) {
    return Boolean(
      board.classList.contains('flipped') ||
      board.closest('.flipped') ||
      document.querySelector('.board.flipped') ||
      document.querySelector('chess-board.flipped')
    )
  }

  if (window.location.hostname.includes('lichess.org')) {
    return Boolean(board.closest('.orientation-black'))
  }

  return false
}

function squareCenter(square: string, boardRect: DOMRect, flipped: boolean): { x: number; y: number } | null {
  const parsed = parseSquare(square)
  if (!parsed) {
    return null
  }

  const cell = boardRect.width / 8
  const xIndex = flipped ? 7 - parsed.file : parsed.file
  const yIndex = flipped ? parsed.rank - 1 : 8 - parsed.rank

  return {
    x: (xIndex + 0.5) * cell,
    y: (yIndex + 0.5) * cell
  }
}

function ensureOverlay(boardRect: DOMRect): SVGSVGElement {
  let overlay = document.getElementById(OVERLAY_ID) as SVGSVGElement | null
  if (!overlay) {
    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    overlay.id = OVERLAY_ID
    overlay.setAttribute('aria-hidden', 'true')
    overlay.style.position = 'fixed'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '2147483647'
    document.body.appendChild(overlay)
  }

  overlay.style.left = `${boardRect.left}px`
  overlay.style.top = `${boardRect.top}px`
  overlay.style.width = `${boardRect.width}px`
  overlay.style.height = `${boardRect.height}px`
  overlay.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`)

  return overlay
}

function clearOverlay(): void {
  const overlay = document.getElementById(OVERLAY_ID)
  if (overlay) {
    overlay.remove()
  }
}

function drawMoves(uciMoves: string[]): void {
  const board = getBoardElement()
  if (!board || uciMoves.length === 0) {
    clearOverlay()
    return
  }

  const rect = board.getBoundingClientRect()
  if (rect.width < 50 || rect.height < 50) {
    clearOverlay()
    return
  }

  const flipped = isFlipped(board)
  const overlay = ensureOverlay(rect)
  overlay.innerHTML = ''

  const strokeWidth = Math.max(1.5, rect.width * 0.0055)
  const targetRadius = Math.max(6, rect.width * 0.028)

  for (let index = 0; index < uciMoves.length; index += 1) {
    const parsed = parseUci(uciMoves[index])
    if (!parsed) {
      continue
    }

    const from = squareCenter(parsed.from, rect, flipped)
    const to = squareCenter(parsed.to, rect, flipped)
    if (!from || !to) {
      continue
    }

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', from.x.toString())
    line.setAttribute('y1', from.y.toString())
    line.setAttribute('x2', to.x.toString())
    line.setAttribute('y2', to.y.toString())
    line.setAttribute('stroke', '#1f2937')
    line.setAttribute('stroke-width', strokeWidth.toString())
    line.setAttribute('stroke-linecap', 'round')
    line.setAttribute('opacity', Math.max(0.12, 0.45 - index * 0.05).toString())

    const target = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    target.setAttribute('cx', to.x.toString())
    target.setAttribute('cy', to.y.toString())
    target.setAttribute('r', targetRadius.toString())
    target.setAttribute('fill', '#f8fafc')
    target.setAttribute('stroke', '#1f2937')
    target.setAttribute('stroke-width', Math.max(1.25, rect.width * 0.0035).toString())
    target.setAttribute('opacity', Math.max(0.14, 0.5 - index * 0.05).toString())

    overlay.appendChild(line)
    overlay.appendChild(target)
  }

  if (overlay.childElementCount === 0) {
    clearOverlay()
  }
}

export function updateBoardSuggestion(insight: PositionInsight | null | undefined): void {
  if (!insight?.hintsEnabled) {
    lastMoves = []
    clearOverlay()
    return
  }

  const moves = (insight?.theoreticalMoves ?? [])
    .map((entry) => entry.uci)
    .filter((uci) => /^[a-h][1-8][a-h][1-8][nbrq]?$/.test(uci))

  if (moves.length === 0) {
    lastMoves = []
    clearOverlay()
    return
  }

  lastMoves = moves
  drawMoves(moves)
}

export function setupOverlayAutoRefresh(): void {
  const rerender = () => {
    if (lastMoves.length > 0) {
      drawMoves(lastMoves)
    }
  }

  window.addEventListener('resize', rerender)
  window.addEventListener('scroll', rerender, { passive: true })
}
