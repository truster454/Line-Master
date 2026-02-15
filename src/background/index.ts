import { OpeningsService } from '../core/openings'
import { createLogger } from '../shared/logger'
import type { PositionInsight, PositionSnapshot, TheoreticalMove } from '../shared/types'
import { FavoritesRepo } from './storage'

const log = createLogger('background')
const openingsService = new OpeningsService()
const favoritesRepo = new FavoritesRepo()
const HINTS_ENABLED_KEY = 'hintsEnabled'

let hintsEnabled = false

let latestInsight: PositionInsight = {
  snapshot: null,
  theoreticalMoves: [],
  matchedBooks: 0,
  hintsEnabled,
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

function bookNameFromPath(path: string): string {
  const file = path.split('/').pop() ?? ''
  return file.replace(/\.bin$/i, '')
}

function aggregateMoves(hits: Awaited<ReturnType<OpeningsService['lookupAllBooksByFen']>>): TheoreticalMove[] {
  const byMove = new Map<string, TheoreticalMove>()

  for (const hit of hits) {
    for (const candidate of hit.lookup.candidates) {
      const existing = byMove.get(candidate.uci)
      if (!existing) {
        byMove.set(candidate.uci, {
          uci: candidate.uci,
          totalWeight: candidate.weight,
          booksCount: 1,
          openingIds: [hit.openingId]
        })
        continue
      }

      existing.totalWeight += candidate.weight
      if (!existing.openingIds.includes(hit.openingId)) {
        existing.openingIds.push(hit.openingId)
        existing.booksCount += 1
      }
    }
  }

  return [...byMove.values()].sort((a, b) => b.totalWeight - a.totalWeight)
}

async function computeInsight(snapshot: PositionSnapshot | null): Promise<PositionInsight> {
  const enabled = hintsEnabled
  if (!snapshot) {
    return {
      snapshot: null,
      theoreticalMoves: [],
      matchedBooks: 0,
      hintsEnabled: enabled,
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
        bookStatus: 'move-not-found',
        updatedAt: Date.now()
      }
    }

    const theoreticalMoves = aggregateMoves(hits)
    const topHit = hits[0]

    return {
      snapshot,
      openingId: topHit.opening?.id,
      openingName: bookNameFromPath(topHit.path) || topHit.opening?.name,
      bookMoveUci: theoreticalMoves[0]?.uci,
      theoreticalMoves,
      matchedBooks: hits.length,
      hintsEnabled: enabled,
      bookStatus: theoreticalMoves.length > 0 ? 'move-found' : 'move-not-found',
      updatedAt: Date.now()
    }
  } catch (error) {
    return {
      snapshot,
      theoreticalMoves: [],
      matchedBooks: 0,
      hintsEnabled: enabled,
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

chrome.runtime.onInstalled.addListener(() => {
  log.info('Service worker installed')
})

void loadHintsEnabled().then((value) => {
  hintsEnabled = value
  latestInsight = { ...latestInsight, hintsEnabled: value, updatedAt: Date.now() }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ ok: true })
    return false
  }

  if (message?.type === 'position:get') {
    sendResponse({ ok: true, payload: latestInsight })
    return false
  }

  if (message?.type === 'hints:get') {
    sendResponse({ ok: true, payload: hintsEnabled })
    return false
  }

  if (message?.type === 'hints:set') {
    void (async () => {
      await setHintsEnabled(Boolean(message.payload?.enabled))
      const nextInsight: PositionInsight = { ...latestInsight, hintsEnabled, updatedAt: Date.now() }
      await broadcastInsight(nextInsight)
      sendResponse({ ok: true, payload: hintsEnabled })
    })()
    return true
  }

  if (message?.type === 'position:update') {
    void (async () => {
      const snapshot = message.payload as PositionSnapshot
      const insight = await computeInsight(snapshot)
      await broadcastInsight(insight)
      sendResponse({ ok: true, payload: insight })
    })()
    return true
  }

  if (message?.type === 'favorites:list') {
    void favoritesRepo.list().then((favorites) => {
      sendResponse({ ok: true, payload: favorites })
    })
    return true
  }

  if (message?.type === 'favorites:add') {
    void favoritesRepo.add(message.payload?.id as string).then(() => {
      sendResponse({ ok: true })
    })
    return true
  }

  if (message?.type === 'favorites:remove') {
    void favoritesRepo.remove(message.payload?.id as string).then(() => {
      sendResponse({ ok: true })
    })
    return true
  }

  return false
})
