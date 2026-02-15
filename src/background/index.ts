import { OpeningsService } from '../core/openings'
import classificationRaw from '../data/openings.classification.txt?raw'
import { createLogger } from '../shared/logger'
import type { PerformanceMode, PositionInsight, PositionSnapshot, TheoreticalMove } from '../shared/types'
import { FavoritesRepo } from './storage'

const log = createLogger('background')
const openingsService = new OpeningsService()
const favoritesRepo = new FavoritesRepo()
const HINTS_ENABLED_KEY = 'hintsEnabled'
const PERFORMANCE_MODE_KEY = 'performanceMode'

let hintsEnabled = false
let performanceMode: PerformanceMode = 'standard'
let settingsReady = false
let settingsLoadInFlight: Promise<void> | null = null
let favoritesReady = false
let favoritesLoadInFlight: Promise<void> | null = null
let favoriteIds = new Set<string>()

const CLASSIFICATION_LINE_RE = /^(\S+)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+)$/
const RUS_NAME_BY_BOOK_FILE = new Map<string, string>()

for (const rawLine of classificationRaw.split(/\r?\n/)) {
  const line = rawLine.trim()
  if (!line || line.startsWith('#')) {
    continue
  }
  const match = line.match(CLASSIFICATION_LINE_RE)
  if (!match) {
    continue
  }
  RUS_NAME_BY_BOOK_FILE.set(match[1], match[2])
}

let latestInsight: PositionInsight = {
  snapshot: null,
  theoreticalMoves: [],
  matchedBooks: 0,
  hintsEnabled,
  performanceMode,
  bookStatus: 'position-not-detected',
  updatedAt: Date.now()
}

async function loadHintsEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(HINTS_ENABLED_KEY)
  return Boolean(result[HINTS_ENABLED_KEY])
}

async function setHintsEnabled(next: boolean): Promise<void> {
  hintsEnabled = next
  await chrome.storage.local.set({ [HINTS_ENABLED_KEY]: next })
}

async function loadPerformanceMode(): Promise<PerformanceMode> {
  const result = await chrome.storage.local.get(PERFORMANCE_MODE_KEY)
  return result[PERFORMANCE_MODE_KEY] === 'economy' ? 'economy' : 'standard'
}

async function setPerformanceMode(next: PerformanceMode): Promise<void> {
  performanceMode = next
  await chrome.storage.local.set({ [PERFORMANCE_MODE_KEY]: next })
}

async function refreshSettingsFromStorage(force = false): Promise<void> {
  if (settingsReady && !force) {
    return
  }

  if (!settingsLoadInFlight) {
    settingsLoadInFlight = (async () => {
      const [storedHintsEnabled, storedPerformanceMode] = await Promise.all([
        loadHintsEnabled(),
        loadPerformanceMode()
      ])

      hintsEnabled = storedHintsEnabled
      performanceMode = storedPerformanceMode
      latestInsight = {
        ...latestInsight,
        hintsEnabled,
        performanceMode,
        updatedAt: Date.now()
      }
      settingsReady = true
    })().finally(() => {
      settingsLoadInFlight = null
    })
  }

  await settingsLoadInFlight
}

function bookNameFromPath(path: string): string {
  const file = path.split('/').pop() ?? ''
  const byClassification = RUS_NAME_BY_BOOK_FILE.get(file)
  if (byClassification) {
    return byClassification
  }
  return file
    .replace(/\.bin$/i, '')
    .replace(/_/g, ' ')
    .trim()
}

async function refreshFavoritesFromStorage(force = false): Promise<void> {
  if (favoritesReady && !force) {
    return
  }

  if (!favoritesLoadInFlight) {
    favoritesLoadInFlight = (async () => {
      const stored = await favoritesRepo.list()
      favoriteIds = new Set(stored)
      favoritesReady = true
    })().finally(() => {
      favoritesLoadInFlight = null
    })
  }

  await favoritesLoadInFlight
}

function aggregateMoves(
  hits: Awaited<ReturnType<OpeningsService['lookupAllBooksByFen']>>,
  favorites: Set<string>
): TheoreticalMove[] {
  const byMove = new Map<
    string,
    TheoreticalMove & {
      firstSeenIndex: number
    }
  >()
  let seenIndex = 0

  for (const hit of hits) {
    const isFavoriteBook = favorites.has(hit.openingId)
    for (const candidate of hit.lookup.candidates) {
      const existing = byMove.get(candidate.uci)
      if (!existing) {
        byMove.set(candidate.uci, {
          uci: candidate.uci,
          totalWeight: candidate.weight,
          booksCount: 1,
          favoriteBooksCount: isFavoriteBook ? 1 : 0,
          firstSeenIndex: seenIndex,
          openingIds: [hit.openingId]
        })
        seenIndex += 1
        continue
      }

      existing.totalWeight += candidate.weight
      if (isFavoriteBook) {
        existing.favoriteBooksCount += 1
      }
      if (!existing.openingIds.includes(hit.openingId)) {
        existing.openingIds.push(hit.openingId)
        existing.booksCount += 1
      }
    }
  }

  return [...byMove.values()]
    .sort((a, b) => {
      if (a.favoriteBooksCount !== b.favoriteBooksCount) {
        return b.favoriteBooksCount - a.favoriteBooksCount
      }
      if (a.totalWeight !== b.totalWeight) {
        return b.totalWeight - a.totalWeight
      }
      return a.firstSeenIndex - b.firstSeenIndex
    })
    .map(({ firstSeenIndex, ...rest }) => rest)
}

function selectPrimaryHit(
  hits: Awaited<ReturnType<OpeningsService['lookupAllBooksByFen']>>,
  favorites: Set<string>
): { hit: (typeof hits)[number]; fromFavorite: boolean } {
  let best: (typeof hits)[number] | null = null
  let bestRank = -1
  let bestWeight = -1

  for (const hit of hits) {
    const rank = favorites.has(hit.openingId) ? 1 : 0
    const weight = hit.lookup.best?.weight ?? 0
    if (rank > bestRank || (rank === bestRank && weight > bestWeight)) {
      best = hit
      bestRank = rank
      bestWeight = weight
    }
  }

  const hit = best ?? hits[0]
  return { hit, fromFavorite: favorites.has(hit.openingId) }
}

async function computeInsight(snapshot: PositionSnapshot | null): Promise<PositionInsight> {
  await refreshFavoritesFromStorage()
  const enabled = hintsEnabled
  if (!snapshot) {
    return {
      snapshot: null,
      theoreticalMoves: [],
      matchedBooks: 0,
      hintsEnabled: enabled,
      performanceMode,
      bookStatus: 'position-not-detected',
      updatedAt: Date.now()
    }
  }

  if (!snapshot.fen) {
    return {
      snapshot,
      theoreticalMoves: [],
      matchedBooks: 0,
      hintsEnabled: enabled,
      performanceMode,
      bookStatus: 'fen-missing',
      updatedAt: Date.now()
    }
  }

  try {
    const hits = await openingsService.lookupAllBooksByFen(snapshot.fen)
    if (hits.length === 0) {
      return {
        snapshot,
        theoreticalMoves: [],
        matchedBooks: 0,
        hintsEnabled: enabled,
        performanceMode,
        bookStatus: 'move-not-found',
        updatedAt: Date.now()
      }
    }

    const theoreticalMoves = aggregateMoves(hits, favoriteIds)
    const primary = selectPrimaryHit(hits, favoriteIds)
    const topHit = primary.hit
    const selectedMove = topHit.lookup.best?.uci ?? theoreticalMoves[0]?.uci
    const favoriteBookMoveUci = primary.fromFavorite ? selectedMove : undefined

    return {
      snapshot,
      openingId: topHit.opening?.id,
      openingName: bookNameFromPath(topHit.path) || topHit.opening?.name,
      bookMoveUci: selectedMove,
      favoriteBookMoveUci,
      theoreticalMoves,
      matchedBooks: hits.length,
      hintsEnabled: enabled,
      performanceMode,
      bookStatus: theoreticalMoves.length > 0 ? 'move-found' : 'move-not-found',
      updatedAt: Date.now()
    }
  } catch (error) {
    return {
      snapshot,
      theoreticalMoves: [],
      matchedBooks: 0,
      hintsEnabled: enabled,
      performanceMode,
      bookStatus: 'book-load-error',
      error: error instanceof Error ? error.message : 'Unknown book error',
      updatedAt: Date.now()
    }
  }
}

async function broadcastInsight(insight: PositionInsight): Promise<void> {
  latestInsight = insight
  try {
    await chrome.runtime.sendMessage({ type: 'position:state', payload: insight })
  } catch {
    // popup may be closed; ignore.
  }
}

async function broadcastFavoritesState(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'favorites:state', payload: [...favoriteIds] })
  } catch {
    // popup may be closed; ignore.
  }
}

chrome.runtime.onInstalled.addListener(() => {
  log.info('Service worker installed')
})

void loadHintsEnabled().then((value) => {
  hintsEnabled = value
  latestInsight = { ...latestInsight, hintsEnabled: value, updatedAt: Date.now() }
})

void loadPerformanceMode().then((value) => {
  performanceMode = value
  latestInsight = { ...latestInsight, performanceMode: value, updatedAt: Date.now() }
})

void refreshSettingsFromStorage(true)
void refreshFavoritesFromStorage(true)

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true })
    return false
  }

  if (message?.type === 'position:get') {
    void (async () => {
      await refreshSettingsFromStorage()
      sendResponse({ ok: true, payload: latestInsight })
    })()
    return true
  }

  if (message?.type === 'hints:get') {
    void (async () => {
      await refreshSettingsFromStorage()
      sendResponse({ ok: true, payload: hintsEnabled })
    })()
    return true
  }

  if (message?.type === 'performance:get') {
    void (async () => {
      await refreshSettingsFromStorage()
      sendResponse({ ok: true, payload: performanceMode })
    })()
    return true
  }

  if (message?.type === 'settings:get') {
    void (async () => {
      await refreshSettingsFromStorage()
      sendResponse({ ok: true, payload: { hintsEnabled, performanceMode } })
    })()
    return true
  }

  if (message?.type === 'hints:set') {
    void (async () => {
      await refreshSettingsFromStorage()
      await setHintsEnabled(Boolean(message.payload?.enabled))
      const nextInsight: PositionInsight = { ...latestInsight, hintsEnabled, performanceMode, updatedAt: Date.now() }
      await broadcastInsight(nextInsight)
      sendResponse({ ok: true, payload: hintsEnabled })
    })()
    return true
  }

  if (message?.type === 'performance:set') {
    void (async () => {
      await refreshSettingsFromStorage()
      const nextMode: PerformanceMode = message.payload?.mode === 'economy' ? 'economy' : 'standard'
      await setPerformanceMode(nextMode)
      const nextInsight: PositionInsight = { ...latestInsight, hintsEnabled, performanceMode, updatedAt: Date.now() }
      await broadcastInsight(nextInsight)
      sendResponse({ ok: true, payload: performanceMode })
    })()
    return true
  }

  if (message?.type === 'position:update') {
    void (async () => {
      await refreshSettingsFromStorage()
      const snapshot = message.payload as PositionSnapshot
      const insight = await computeInsight(snapshot)
      await broadcastInsight(insight)
      sendResponse({ ok: true, payload: insight })
    })()
    return true
  }

  if (message?.type === 'favorites:list') {
    void (async () => {
      await refreshFavoritesFromStorage()
      sendResponse({ ok: true, payload: [...favoriteIds] })
    })
    return true
  }

  if (message?.type === 'favorites:add') {
    void (async () => {
      const id = String(message.payload?.id ?? '')
      if (id) {
        await favoritesRepo.add(id)
      }
      await refreshFavoritesFromStorage(true)
      await broadcastFavoritesState()
      if (latestInsight.snapshot) {
        const refreshed = await computeInsight(latestInsight.snapshot)
        await broadcastInsight(refreshed)
      }
      sendResponse({ ok: true })
    })()
    return true
  }

  if (message?.type === 'favorites:remove') {
    void (async () => {
      const id = String(message.payload?.id ?? '')
      if (id) {
        await favoritesRepo.remove(id)
      }
      await refreshFavoritesFromStorage(true)
      await broadcastFavoritesState()
      if (latestInsight.snapshot) {
        const refreshed = await computeInsight(latestInsight.snapshot)
        await broadcastInsight(refreshed)
      }
      sendResponse({ ok: true })
    })()
    return true
  }

  return false
})
