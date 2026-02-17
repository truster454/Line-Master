import { OpeningsService } from '../core/openings'
import classificationRaw from '../data/openings.classification.txt?raw'
import { createLogger } from '../shared/logger'
import booksIndexData from '../data/books.index.json'
import type { PerformanceMode, PositionInsight, PositionSnapshot, RatingRange, TheoreticalMove } from '../shared/types'
import { FavoritesRepo } from './storage'

const log = createLogger('background')
const openingsService = new OpeningsService()
const favoritesRepo = new FavoritesRepo()
const HINTS_ENABLED_KEY = 'hintsEnabled'
const PERFORMANCE_MODE_KEY = 'performanceMode'
const RATING_RANGE_KEY = 'ratingRange'
const LIMITS_DISABLED_KEY = 'limitsDisabled'
const DEFAULT_RATING_RANGE: RatingRange = '1000-1300'
const DEPTH_LIMIT_BY_RATING: Record<RatingRange, number> = {
  '0-700': 3,
  '700-1000': 4,
  '1000-1300': 5,
  '1300-1600': 6,
  '1600-2000': 8,
  '2000+': 10
}
const LINE_LIMIT_BY_RATING: Record<RatingRange, number> = {
  '0-700': 2,
  '700-1000': 3,
  '1000-1300': 4,
  '1300-1600': 5,
  '1600-2000': 7,
  '2000+': 10
}
const RATING_ORDER: RatingRange[] = ['0-700', '700-1000', '1000-1300', '1300-1600', '1600-2000', '2000+']

let hintsEnabled = false
let performanceMode: PerformanceMode = 'standard'
let ratingRange: RatingRange = DEFAULT_RATING_RANGE
let limitsDisabled = false
let settingsReady = false
let settingsLoadInFlight: Promise<void> | null = null
let favoritesReady = false
let favoritesLoadInFlight: Promise<void> | null = null
let favoriteIds = new Set<string>()

const CLASSIFICATION_LINE_RE = /^(\S+)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)(?:\s{2,}(.+))?$/
const RUS_NAME_BY_BOOK_FILE = new Map<string, string>()
const RATING_BY_BOOK_FILE = new Map<string, RatingRange>()
const RATING_BY_OPENING_ID = new Map<string, RatingRange>()
const booksIndex = booksIndexData as Record<string, string>

function normalizeRatingRange(value: string): RatingRange | null {
  const normalized = value.replace(/–/g, '-').replace(/\s+/g, '')
  return (RATING_ORDER as string[]).includes(normalized) ? (normalized as RatingRange) : null
}

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
  const lineRating = normalizeRatingRange(match[3])
  if (lineRating) {
    RATING_BY_BOOK_FILE.set(match[1], lineRating)
  }
}

for (const [openingId, path] of Object.entries(booksIndex)) {
  const bookFile = path.split('/').pop()
  if (!bookFile) {
    continue
  }
  const mappedRating = RATING_BY_BOOK_FILE.get(bookFile)
  if (mappedRating) {
    RATING_BY_OPENING_ID.set(openingId, mappedRating)
  }
}

function makeSettingsPayload() {
  return {
    hintsEnabled,
    performanceMode,
    ratingRange,
    limitsDisabled
  }
}

async function broadcastSettingsState(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'settings:state', payload: makeSettingsPayload() })
  } catch {
    // popup may be closed; ignore.
  }
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

async function loadRatingRange(): Promise<RatingRange> {
  const result = await chrome.storage.local.get(RATING_RANGE_KEY)
  return normalizeRatingRange(String(result[RATING_RANGE_KEY] ?? '')) ?? DEFAULT_RATING_RANGE
}

async function setRatingRange(next: RatingRange): Promise<void> {
  ratingRange = next
  await chrome.storage.local.set({ [RATING_RANGE_KEY]: next })
}

async function loadLimitsDisabled(): Promise<boolean> {
  const result = await chrome.storage.local.get(LIMITS_DISABLED_KEY)
  return Boolean(result[LIMITS_DISABLED_KEY])
}

async function setLimitsDisabled(next: boolean): Promise<void> {
  limitsDisabled = next
  await chrome.storage.local.set({ [LIMITS_DISABLED_KEY]: next })
}

async function refreshSettingsFromStorage(force = false): Promise<void> {
  if (settingsReady && !force) {
    return
  }

  if (!settingsLoadInFlight) {
    settingsLoadInFlight = (async () => {
      const [storedHintsEnabled, storedPerformanceMode, storedRatingRange, storedLimitsDisabled] = await Promise.all([
        loadHintsEnabled(),
        loadPerformanceMode(),
        loadRatingRange(),
        loadLimitsDisabled()
      ])

      hintsEnabled = storedHintsEnabled
      performanceMode = storedPerformanceMode
      ratingRange = storedRatingRange
      limitsDisabled = storedLimitsDisabled
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
      if (a.totalWeight !== b.totalWeight) {
        return b.totalWeight - a.totalWeight
      }
      return a.firstSeenIndex - b.firstSeenIndex
    })
    .map(({ firstSeenIndex, ...rest }) => rest)
}

function isFavoriteMove(move: TheoreticalMove, favorites: Set<string>): boolean {
  return move.openingIds.some((openingId) => favorites.has(openingId))
}

function selectPrimaryHit(
  hits: Awaited<ReturnType<OpeningsService['lookupAllBooksByFen']>>
): (typeof hits)[number] {
  let best: (typeof hits)[number] | null = null
  let bestWeight = -1

  for (const hit of hits) {
    const weight = hit.lookup.best?.weight ?? 0
    if (weight > bestWeight) {
      best = hit
      bestWeight = weight
    }
  }

  return best ?? hits[0]
}

function isOpeningAllowedByRating(openingId: string): boolean {
  const openingRating = RATING_BY_OPENING_ID.get(openingId)
  if (!openingRating) {
    return true
  }
  const openingRank = RATING_ORDER.indexOf(openingRating)
  const selectedRank = RATING_ORDER.indexOf(ratingRange)
  if (openingRank === -1 || selectedRank === -1) {
    return true
  }
  return openingRank <= selectedRank
}

function getPlayedFullMoves(plies: number): number {
  return Math.ceil(Math.max(0, plies) / 2)
}

function extractFenTurn(fen: string): 'w' | 'b' | null {
  const parts = fen.trim().split(/\s+/)
  const turn = parts[1]
  return turn === 'w' || turn === 'b' ? turn : null
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
    const activeTurn = extractFenTurn(snapshot.fen)
    if (snapshot.playerColor && activeTurn && snapshot.playerColor !== activeTurn) {
      return {
        snapshot,
        theoreticalMoves: [],
        matchedBooks: 0,
        hintsEnabled: enabled,
        performanceMode,
        bookStatus: 'not-player-turn',
        updatedAt: Date.now()
      }
    }

    const fullMovesPlayed = getPlayedFullMoves(snapshot.moves.length)
    const maxDepth = DEPTH_LIMIT_BY_RATING[ratingRange]

    if (!limitsDisabled && fullMovesPlayed > maxDepth) {
      return {
        snapshot,
        theoreticalMoves: [],
        matchedBooks: 0,
        hintsEnabled: enabled,
        performanceMode,
        bookStatus: 'depth-limit',
        updatedAt: Date.now()
      }
    }

    const hitsAll = await openingsService.lookupAllBooksByFen(snapshot.fen)
    const hits = limitsDisabled ? hitsAll : hitsAll.filter((hit) => isOpeningAllowedByRating(hit.openingId))
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

    const aggregatedMoves = aggregateMoves(hits, favoriteIds)
    const lineLimit = LINE_LIMIT_BY_RATING[ratingRange]
    const limitedByRatingMoves = (() => {
      const favoriteMoves = aggregatedMoves.filter((move) => isFavoriteMove(move, favoriteIds))
      if (favoriteMoves.length > 0) {
        return favoriteMoves.slice(0, lineLimit)
      }
      return aggregatedMoves.slice(0, lineLimit)
    })()
    const theoreticalMoves = limitsDisabled ? aggregatedMoves : limitedByRatingMoves
    if (theoreticalMoves.length === 0) {
      return {
        snapshot,
        theoreticalMoves: [],
        matchedBooks: hits.length,
        hintsEnabled: enabled,
        performanceMode,
        bookStatus: 'move-not-found',
        updatedAt: Date.now()
      }
    }
    const topHit = selectPrimaryHit(hits)
    const selectedMove = theoreticalMoves[0]?.uci
    const favoriteBookMoveUci = theoreticalMoves.find((move) =>
      move.openingIds.some((openingId) => favoriteIds.has(openingId))
    )?.uci

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

void loadRatingRange().then((value) => {
  ratingRange = value
})

void loadLimitsDisabled().then((value) => {
  limitsDisabled = value
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
      sendResponse({ ok: true, payload: makeSettingsPayload() })
    })()
    return true
  }

  if (message?.type === 'hints:set') {
    void (async () => {
      await refreshSettingsFromStorage()
      await setHintsEnabled(Boolean(message.payload?.enabled))
      const nextInsight: PositionInsight = { ...latestInsight, hintsEnabled, performanceMode, updatedAt: Date.now() }
      await broadcastInsight(nextInsight)
      await broadcastSettingsState()
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
      await broadcastSettingsState()
      sendResponse({ ok: true, payload: performanceMode })
    })()
    return true
  }

  if (message?.type === 'rating:set') {
    void (async () => {
      await refreshSettingsFromStorage()
      const nextRating = normalizeRatingRange(String(message.payload?.ratingRange ?? ''))
      if (!nextRating) {
        sendResponse({ ok: false, error: 'invalid-rating-range' })
        return
      }
      await setRatingRange(nextRating)
      await broadcastSettingsState()
      if (latestInsight.snapshot) {
        const refreshed = await computeInsight(latestInsight.snapshot)
        await broadcastInsight(refreshed)
      }
      sendResponse({ ok: true, payload: ratingRange })
    })()
    return true
  }

  if (message?.type === 'limits:set') {
    void (async () => {
      await refreshSettingsFromStorage()
      await setLimitsDisabled(Boolean(message.payload?.disabled))
      await broadcastSettingsState()
      if (latestInsight.snapshot) {
        const refreshed = await computeInsight(latestInsight.snapshot)
        await broadcastInsight(refreshed)
      }
      sendResponse({ ok: true, payload: limitsDisabled })
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
