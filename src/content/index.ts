import { detectChessCom } from './detectors/chesscom'
import { detectLichess } from './detectors/lichess'
import { setupOverlayAutoRefresh, updateBoardSuggestion } from './overlay'
import type { PositionInsight, PositionSnapshot } from '../shared/types'

const POLL_INTERVAL_MS = 2500
const HINTS_SYNC_INTERVAL_MS = 6000
const REPORT_DEBOUNCE_MS = 120

let lastSignature = ''
let lastInsight: PositionInsight | null = null
let hintsEnabled = false
let reportTimer: number | null = null
let reportInFlight = false
let reportQueued = false
let forceNextReport = false
let hintsSyncInFlight = false

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

function sendRuntimeMessage<T>(message: unknown): Promise<T | null> {
  const runtime = globalThis.chrome?.runtime
  if (!runtime?.sendMessage) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    runtime.sendMessage(message, (response) => {
      if (globalThis.chrome?.runtime?.lastError) {
        resolve(null)
        return
      }
      resolve((response ?? null) as T | null)
    })
  })
}

async function reportPosition(force = false): Promise<void> {
  const snapshot = await detectPosition()
  const signature = makeSignature(snapshot)

  if (!snapshot || (!force && signature === lastSignature)) {
    return
  }

  lastSignature = signature

  const response = await sendRuntimeMessage<{ ok?: boolean; payload?: PositionInsight }>({
    type: 'position:update',
    payload: snapshot
  })

  if (response?.ok && response.payload) {
    lastInsight = response.payload
    hintsEnabled = Boolean(lastInsight.hintsEnabled)
    updateBoardSuggestion(lastInsight)
  }
}

function queueReport(force = false): void {
  reportQueued = true
  forceNextReport = forceNextReport || force
  if (reportTimer !== null) {
    return
  }

  reportTimer = window.setTimeout(() => {
    reportTimer = null
    void flushQueuedReport()
  }, REPORT_DEBOUNCE_MS)
}

async function flushQueuedReport(): Promise<void> {
  if (!reportQueued || document.hidden) {
    reportQueued = false
    forceNextReport = false
    return
  }

  if (reportInFlight) {
    queueReport()
    return
  }

  reportQueued = false
  const force = forceNextReport
  forceNextReport = false
  reportInFlight = true

  try {
    await reportPosition(force)
  } finally {
    reportInFlight = false
    if (reportQueued || forceNextReport) {
      queueReport()
    }
  }
}

async function syncHintsState(): Promise<void> {
  if (hintsSyncInFlight) {
    return
  }
  hintsSyncInFlight = true

  try {
    const response = await sendRuntimeMessage<{ ok?: boolean; payload?: boolean }>({ type: 'hints:get' })
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
    queueReport(true)
  } finally {
    hintsSyncInFlight = false
  }
}

function startReporting(): void {
  setupOverlayAutoRefresh()

  const runtime = globalThis.chrome?.runtime
  if (runtime?.onMessage) {
    runtime.onMessage.addListener((message: unknown) => {
      const payload = message as { type?: string; payload?: PositionInsight }
      if (payload.type === 'position:state' && payload.payload) {
        if (lastInsight?.updatedAt === payload.payload.updatedAt) {
          return
        }
        lastInsight = payload.payload
        hintsEnabled = Boolean(payload.payload.hintsEnabled)
        updateBoardSuggestion(payload.payload)
      }
    })
  }

  queueReport(true)
  void syncHintsState()

  const observer = new MutationObserver(() => {
    queueReport()
  })

  observer.observe(document.body ?? document.documentElement, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  })

  window.setInterval(() => {
    if (!document.hidden) {
      queueReport()
    }
  }, POLL_INTERVAL_MS)

  window.setInterval(() => {
    if (!document.hidden) {
      void syncHintsState()
    }
  }, HINTS_SYNC_INTERVAL_MS)

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      queueReport(true)
      void syncHintsState()
    }
  })

  window.addEventListener('focus', () => {
    queueReport(true)
    void syncHintsState()
  })
}

startReporting()
