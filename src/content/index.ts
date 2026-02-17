import { detectChessCom } from './detectors/chesscom'
import { detectLichess } from './detectors/lichess'
import { setupOverlayAutoRefresh, updateBoardSuggestion } from './overlay'
import type { PerformanceMode, PositionInsight, PositionSnapshot } from '../shared/types'

const PERFORMANCE_PROFILES: Record<
  PerformanceMode,
  {
    pollIntervalMs: number
    settingsSyncIntervalMs: number
    reportDebounceMs: number
    mutationThrottleMs: number
    maxOverlayMoves: number
  }
> = {
  standard: {
    pollIntervalMs: 2500,
    settingsSyncIntervalMs: 6000,
    reportDebounceMs: 120,
    mutationThrottleMs: 0,
    maxOverlayMoves: Number.MAX_SAFE_INTEGER
  },
  economy: {
    pollIntervalMs: 5200,
    settingsSyncIntervalMs: 10000,
    reportDebounceMs: 280,
    mutationThrottleMs: 850,
    maxOverlayMoves: 3
  }
}

let lastSignature = ''
let lastInsight: PositionInsight | null = null
let hintsEnabled = false
let performanceMode: PerformanceMode = 'standard'
let reportTimer: number | null = null
let reportInFlight = false
let reportQueued = false
let forceNextReport = false
let settingsSyncInFlight = false
let lastMutationQueuedAt = 0

function getProfile(): (typeof PERFORMANCE_PROFILES)[PerformanceMode] {
  return PERFORMANCE_PROFILES[performanceMode]
}

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
    try {
      runtime.sendMessage(message, (response) => {
        if (globalThis.chrome?.runtime?.lastError) {
          resolve(null)
          return
        }
        resolve((response ?? null) as T | null)
      })
    } catch {
      // Happens when extension is reloaded and this content script context is invalidated.
      resolve(null)
    }
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
    performanceMode = lastInsight.performanceMode ?? performanceMode
    updateBoardSuggestion(lastInsight, { maxMoves: getProfile().maxOverlayMoves })
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
  }, getProfile().reportDebounceMs)
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

async function syncRuntimeSettings(): Promise<void> {
  if (settingsSyncInFlight) {
    return
  }
  settingsSyncInFlight = true

  try {
    const response = await sendRuntimeMessage<{
      ok?: boolean
      payload?: { hintsEnabled?: boolean; performanceMode?: PerformanceMode }
    }>({ type: 'settings:get' })
    if (!response?.ok) {
      return
    }

    const nextHintsEnabled = Boolean(response.payload?.hintsEnabled)
    const nextPerformanceMode = response.payload?.performanceMode === 'economy' ? 'economy' : 'standard'
    const hintsChanged = nextHintsEnabled !== hintsEnabled
    const modeChanged = nextPerformanceMode !== performanceMode

    if (!hintsChanged && !modeChanged) {
      return
    }

    hintsEnabled = nextHintsEnabled
    performanceMode = nextPerformanceMode

    if (!nextHintsEnabled) {
      updateBoardSuggestion({ ...(lastInsight ?? ({} as PositionInsight)), hintsEnabled: false } as PositionInsight)
      return
    }

    if (lastInsight) {
      updateBoardSuggestion({ ...lastInsight, hintsEnabled: true }, { maxMoves: getProfile().maxOverlayMoves })
    }
    queueReport(true)
  } finally {
    settingsSyncInFlight = false
  }
}

function startPollLoop(): void {
  const tick = () => {
    window.setTimeout(() => {
      if (!document.hidden) {
        queueReport()
      }
      tick()
    }, getProfile().pollIntervalMs)
  }

  tick()
}

function startSettingsLoop(): void {
  const tick = () => {
    window.setTimeout(() => {
      if (!document.hidden) {
        void syncRuntimeSettings()
      }
      tick()
    }, getProfile().settingsSyncIntervalMs)
  }

  tick()
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
        performanceMode = payload.payload.performanceMode ?? performanceMode
        updateBoardSuggestion(payload.payload, { maxMoves: getProfile().maxOverlayMoves })
      }
    })
  }

  queueReport(true)
  void syncRuntimeSettings()

  const observer = new MutationObserver(() => {
    const mutationThrottleMs = getProfile().mutationThrottleMs
    if (mutationThrottleMs > 0) {
      const now = Date.now()
      if (now - lastMutationQueuedAt < mutationThrottleMs) {
        return
      }
      lastMutationQueuedAt = now
    }
    queueReport()
  })

  observer.observe(document.body ?? document.documentElement, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  })

  startPollLoop()
  startSettingsLoop()

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      queueReport(true)
      void syncRuntimeSettings()
    }
  })

  window.addEventListener('focus', () => {
    queueReport(true)
    void syncRuntimeSettings()
  })
}

startReporting()
