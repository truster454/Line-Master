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
    minReportIntervalMs: number
    maxOverlayMoves: number
  }
> = {
  standard: {
    pollIntervalMs: 2500,
    settingsSyncIntervalMs: 30000,
    reportDebounceMs: 160,
    mutationThrottleMs: 420,
    minReportIntervalMs: 700,
    maxOverlayMoves: Number.MAX_SAFE_INTEGER
  },
  economy: {
    pollIntervalMs: 5200,
    settingsSyncIntervalMs: 45000,
    reportDebounceMs: 280,
    mutationThrottleMs: 850,
    minReportIntervalMs: 900,
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
let lastReportStartedAt = 0

function activePollIntervalMs(): number {
  const base = getProfile().pollIntervalMs
  if (hintsEnabled) {
    return base
  }
  return Math.max(9000, Math.floor(base * 3))
}

function activeSettingsSyncIntervalMs(): number {
  const base = getProfile().settingsSyncIntervalMs
  if (hintsEnabled) {
    return base
  }
  return Math.max(60000, Math.floor(base * 2))
}

function collectObservationRoots(): Element[] {
  const selectors = window.location.hostname.includes('chess.com')
    ? [
        'wc-chess-board',
        'chess-board',
        '[data-cy="board-layout-board"]',
        '.board',
        '[data-cy="move-list"]',
        '.vertical-move-list-component',
        '.move-list-component'
      ]
    : window.location.hostname.includes('lichess.org')
      ? ['cg-board', '.analyse__moves', '.game__moves', '.rmoves']
      : []

  const roots: Element[] = []
  for (const selector of selectors) {
    const node = document.querySelector(selector)
    if (!node || roots.includes(node)) {
      continue
    }
    roots.push(node)
  }
  return roots
}

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

  if (!force) {
    const elapsed = Date.now() - lastReportStartedAt
    const minReportIntervalMs = getProfile().minReportIntervalMs
    if (elapsed < minReportIntervalMs) {
      queueReport()
      return
    }
  }

  reportInFlight = true
  lastReportStartedAt = Date.now()

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
    }, activePollIntervalMs())
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
    }, activeSettingsSyncIntervalMs())
  }

  tick()
}

function startReporting(): void {
  setupOverlayAutoRefresh()

  const runtime = globalThis.chrome?.runtime
  if (runtime?.onMessage) {
    runtime.onMessage.addListener((message: unknown) => {
      const payload = message as {
        type?: string
        payload?: PositionInsight | { hintsEnabled?: boolean; performanceMode?: PerformanceMode }
      }
      if (payload.type === 'position:state' && payload.payload) {
        const insightPayload = payload.payload as PositionInsight
        if (lastInsight?.updatedAt === insightPayload.updatedAt) {
          return
        }
        lastInsight = insightPayload
        hintsEnabled = Boolean(insightPayload.hintsEnabled)
        performanceMode = insightPayload.performanceMode ?? performanceMode
        updateBoardSuggestion(insightPayload, { maxMoves: getProfile().maxOverlayMoves })
      }

      if (payload.type === 'settings:state' && payload.payload) {
        const settingsPayload = payload.payload as { hintsEnabled?: boolean; performanceMode?: PerformanceMode }
        const nextHintsEnabled = Boolean(settingsPayload.hintsEnabled)
        const nextPerformanceMode = settingsPayload.performanceMode === 'economy' ? 'economy' : 'standard'
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
      }
    })
  }

  queueReport(true)
  void syncRuntimeSettings()

  const observer = new MutationObserver(() => {
    if (!hintsEnabled) {
      return
    }

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

  const observeConfig: MutationObserverInit = {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
  }

  const bindObserver = () => {
    observer.disconnect()
    const roots = collectObservationRoots()
    if (roots.length === 0) {
      observer.observe(document.body ?? document.documentElement, observeConfig)
      return
    }
    for (const root of roots) {
      observer.observe(root, observeConfig)
    }
  }

  bindObserver()

  startPollLoop()
  startSettingsLoop()

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      bindObserver()
      queueReport(true)
      void syncRuntimeSettings()
    }
  })

  window.addEventListener('focus', () => {
    bindObserver()
    queueReport(true)
    void syncRuntimeSettings()
  })
}

startReporting()
