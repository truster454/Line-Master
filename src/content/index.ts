import { detectChessCom } from './detectors/chesscom'
import { detectLichess } from './detectors/lichess'
import { setupOverlayAutoRefresh, updateBoardSuggestion } from './overlay'
import type { PositionInsight, PositionSnapshot } from '../shared/types'

const POLL_INTERVAL_MS = 1500

let lastSignature = ''
let lastInsight: PositionInsight | null = null
let hintsEnabled = false

export async function detectPosition(): Promise<PositionSnapshot | null> {
  if (window.location.hostname.includes('chess.com')) {
    return detectChessCom()
  }
  if (window.location.hostname.includes('lichess.org')) {
    return detectLichess()
  }
  return null
}

function makeSignature(snapshot: PositionSnapshot | null): string {
  if (!snapshot) {
    return ''
  }
  return `${snapshot.source}|${snapshot.fen ?? ''}|${snapshot.moves.join(' ')}`
}

async function reportPosition(force = false): Promise<void> {
  const snapshot = await detectPosition()
  const signature = makeSignature(snapshot)

  if (!snapshot || (!force && signature === lastSignature)) {
    return
  }

  lastSignature = signature

  const runtime = globalThis.chrome?.runtime
  if (runtime?.sendMessage) {
    runtime.sendMessage({ type: 'position:update', payload: snapshot }, (response) => {
      if (response?.ok && response.payload) {
        lastInsight = response.payload as PositionInsight
        hintsEnabled = Boolean(lastInsight.hintsEnabled)
        updateBoardSuggestion(lastInsight)
      }
    })
  }
}

function syncHintsState(): void {
  const runtime = globalThis.chrome?.runtime
  if (!runtime?.sendMessage) {
    return
  }

  runtime.sendMessage({ type: 'hints:get' }, (response) => {
    if (!response?.ok) {
      return
    }
    const next = Boolean(response.payload)
    if (next === hintsEnabled) {
      return
    }
    hintsEnabled = next

    if (!next) {
      updateBoardSuggestion({ ...(lastInsight ?? ({} as PositionInsight)), hintsEnabled: false } as PositionInsight)
      return
    }

    if (lastInsight) {
      updateBoardSuggestion({ ...lastInsight, hintsEnabled: true })
    }
    void reportPosition(true)
  })
}

function startReporting(): void {
  setupOverlayAutoRefresh()

  const runtime = globalThis.chrome?.runtime
  if (runtime?.onMessage) {
    runtime.onMessage.addListener((message: unknown) => {
      const payload = message as { type?: string; payload?: PositionInsight }
      if (payload.type === 'position:state' && payload.payload) {
        lastInsight = payload.payload
        hintsEnabled = Boolean(payload.payload.hintsEnabled)
        updateBoardSuggestion(payload.payload)
      }
    })
  }

  void reportPosition(true)
  syncHintsState()

  const observer = new MutationObserver(() => {
    void reportPosition()
  })

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: false
  })

  window.setInterval(() => {
    void reportPosition()
    syncHintsState()
  }, POLL_INTERVAL_MS)
}

startReporting()
