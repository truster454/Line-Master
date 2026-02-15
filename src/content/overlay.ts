import type { PositionInsight } from '../shared/types'

const OVERLAY_ID = 'line-master-board-overlay'
const MOVE_COLORS = ['#2563eb', '#dc2626', '#16a34a']
const PREFERRED_MOVE_COLOR = '#facc15'

let lastMoves: string[] = []
let lastMovesKey = ''
let lastDrawKey = ''
let lastPreferredMove: string | null = null
let rerenderScheduled = false

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
  lastDrawKey = ''
}

function geometryKey(rect: DOMRect, flipped: boolean): string {
  return `${rect.left.toFixed(1)}|${rect.top.toFixed(1)}|${rect.width.toFixed(1)}|${rect.height.toFixed(1)}|${flipped ? 1 : 0}`
}

function getStarIconUrl(): string | null {
  const runtime = globalThis.chrome?.runtime
  if (!runtime?.getURL) {
    return null
  }
  return runtime.getURL('images/star.png')
}

function drawMoves(uciMoves: string[], preferredMoveUci: string | null): void {
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
  const drawKey = `${uciMoves.join(',')}|${preferredMoveUci ?? ''}|${geometryKey(rect, flipped)}`
  if (drawKey === lastDrawKey) {
    return
  }
  lastDrawKey = drawKey

  const overlay = ensureOverlay(rect)
  overlay.innerHTML = ''

  const strokeWidth = Math.max(1.5, rect.width * 0.0055)
  const targetRadius = Math.max(8, rect.width * 0.03)
  const fontSize = Math.max(10, rect.width * 0.028)
  const labelStrokeWidth = Math.max(1, rect.width * 0.003)
  const cellSize = rect.width / 8
  const starSize = Math.max(12, rect.width * 0.042)
  const starIconUrl = getStarIconUrl()

  const parsedMoves = uciMoves
    .map((uci, index) => {
      const parsed = parseUci(uci)
      if (!parsed) {
        return null
      }
      return {
        index,
        rank: index + 1,
        uci,
        from: parsed.from,
        to: parsed.to
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  const byTargetSquare = new Map<string, number[]>()
  for (const move of parsedMoves) {
    const list = byTargetSquare.get(move.to) ?? []
    list.push(move.index)
    byTargetSquare.set(move.to, list)
  }

  const labelOffsets = new Map<number, { x: number; y: number }>()
  for (const [, indexes] of byTargetSquare) {
    if (indexes.length === 1) {
      labelOffsets.set(indexes[0], { x: 0, y: 0 })
      continue
    }

    const spread = Math.min(cellSize * 0.22, targetRadius * 1.45)
    for (let i = 0; i < indexes.length; i += 1) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / indexes.length
      labelOffsets.set(indexes[i], {
        x: Math.cos(angle) * spread,
        y: Math.sin(angle) * spread
      })
    }
  }

  for (const move of parsedMoves) {
    const from = squareCenter(move.from, rect, flipped)
    const to = squareCenter(move.to, rect, flipped)
    if (!from || !to) {
      continue
    }
    const color = MOVE_COLORS[move.index % MOVE_COLORS.length]
    const isPreferred = preferredMoveUci === move.uci
    const effectiveColor = isPreferred ? PREFERRED_MOVE_COLOR : color
    const offset = labelOffsets.get(move.index) ?? { x: 0, y: 0 }
    const labelX = to.x + offset.x
    const labelY = to.y + offset.y

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', from.x.toString())
    line.setAttribute('y1', from.y.toString())
    line.setAttribute('x2', to.x.toString())
    line.setAttribute('y2', to.y.toString())
    line.setAttribute('stroke', effectiveColor)
    line.setAttribute('stroke-width', strokeWidth.toString())
    line.setAttribute('stroke-linecap', 'round')
    line.setAttribute('opacity', isPreferred ? '0.95' : Math.max(0.2, 0.75 - move.index * 0.06).toString())

    const target = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    target.setAttribute('cx', labelX.toString())
    target.setAttribute('cy', labelY.toString())
    target.setAttribute('r', targetRadius.toString())
    target.setAttribute('fill', '#ffffff')
    target.setAttribute('stroke', effectiveColor)
    target.setAttribute('stroke-width', Math.max(1.25, rect.width * 0.0035).toString())
    target.setAttribute('opacity', isPreferred ? '0.95' : Math.max(0.3, 0.9 - move.index * 0.05).toString())

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', labelX.toString())
    label.setAttribute('y', labelY.toString())
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('dominant-baseline', 'central')
    label.setAttribute('font-size', fontSize.toString())
    label.setAttribute('font-weight', '700')
    label.setAttribute('fill', effectiveColor)
    label.setAttribute('stroke', '#ffffff')
    label.setAttribute('stroke-width', labelStrokeWidth.toString())
    label.setAttribute('paint-order', 'stroke')
    label.textContent = isPreferred ? '' : String(move.rank)

    overlay.appendChild(line)
    overlay.appendChild(target)
    if (isPreferred && starIconUrl) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      icon.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', starIconUrl)
      icon.setAttribute('href', starIconUrl)
      icon.setAttribute('x', String(labelX - starSize / 2))
      icon.setAttribute('y', String(labelY - starSize / 2))
      icon.setAttribute('width', String(starSize))
      icon.setAttribute('height', String(starSize))
      icon.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      icon.setAttribute('opacity', '0.95')
      overlay.appendChild(icon)
    } else if (isPreferred) {
      label.textContent = '★'
      overlay.appendChild(label)
    } else {
      overlay.appendChild(label)
    }
  }

  if (overlay.childElementCount === 0) {
    clearOverlay()
  }
}

export function updateBoardSuggestion(
  insight: PositionInsight | null | undefined,
  options?: { maxMoves?: number }
): void {
  if (!insight?.hintsEnabled) {
    lastMoves = []
    lastMovesKey = ''
    lastPreferredMove = null
    clearOverlay()
    return
  }

  const moves = (insight?.theoreticalMoves ?? [])
    .map((entry) => entry.uci)
    .filter((uci) => /^[a-h][1-8][a-h][1-8][nbrq]?$/.test(uci))
  const preferredMove = insight?.favoriteBookMoveUci ?? null

  const orderedMoves =
    preferredMove && moves.includes(preferredMove)
      ? [preferredMove, ...moves.filter((uci) => uci !== preferredMove)]
      : moves

  const maxMoves = options?.maxMoves ?? Number.MAX_SAFE_INTEGER
  const limitedMoves = maxMoves > 0 ? orderedMoves.slice(0, maxMoves) : []

  if (limitedMoves.length === 0) {
    lastMoves = []
    lastMovesKey = ''
    lastPreferredMove = null
    clearOverlay()
    return
  }

  const movesKey = limitedMoves.join(',')
  const hasOverlay = Boolean(document.getElementById(OVERLAY_ID))
  if (movesKey === lastMovesKey && preferredMove === lastPreferredMove && hasOverlay) {
    return
  }

  lastMoves = limitedMoves
  lastMovesKey = movesKey
  lastPreferredMove = preferredMove
  drawMoves(limitedMoves, preferredMove)
}

export function setupOverlayAutoRefresh(): void {
  const rerender = () => {
    if (rerenderScheduled) {
      return
    }
    rerenderScheduled = true
    window.requestAnimationFrame(() => {
      rerenderScheduled = false
      if (lastMoves.length > 0) {
        drawMoves(lastMoves, lastPreferredMove)
      }
    })
  }

  window.addEventListener('resize', rerender)
  window.addEventListener('scroll', rerender, { passive: true })
}
