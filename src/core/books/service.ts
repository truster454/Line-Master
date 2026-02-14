import booksIndexData from '../../data/books.index.json'
import type { Opening } from '../openings/schema'

type BooksIndex = Record<string, string>

export interface BookInfo {
  id: string
  path: string
}

export interface LoadedBook {
  id: string
  path: string
  bytes: ArrayBuffer
  entriesCount: number
}

const booksIndex = booksIndexData as BooksIndex

function normalizeBookKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function entriesCountFromBuffer(buffer: ArrayBuffer): number {
  return Math.floor(buffer.byteLength / 16)
}

export class BookService {
  private readonly loadCache = new Map<string, Promise<LoadedBook | null>>()

  listBooks(): BookInfo[] {
    return Object.entries(booksIndex).map(([id, path]) => ({ id, path }))
  }

  resolveBookPath(openingId: string): string | null {
    const normalized = normalizeBookKey(openingId)
    return booksIndex[normalized] ?? null
  }

  resolveBookPathForOpening(opening: Opening): string | null {
    const byId = this.resolveBookPath(opening.id)
    if (byId) {
      return byId
    }
    return this.resolveBookPath(opening.name)
  }

  hasBookForOpening(opening: Opening): boolean {
    return this.resolveBookPathForOpening(opening) !== null
  }

  async loadBookByOpeningId(openingId: string): Promise<LoadedBook | null> {
    const path = this.resolveBookPath(openingId)
    if (!path) {
      return null
    }
    return this.loadBookByPath(openingId, path)
  }

  async loadBookForOpening(opening: Opening): Promise<LoadedBook | null> {
    const path = this.resolveBookPathForOpening(opening)
    if (!path) {
      return null
    }
    return this.loadBookByPath(opening.id, path)
  }

  private loadBookByPath(openingId: string, path: string): Promise<LoadedBook | null> {
    const cacheKey = `${openingId}:${path}`
    const cached = this.loadCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const task = (async (): Promise<LoadedBook | null> => {
      const runtime = globalThis.chrome?.runtime
      const url = runtime?.getURL ? runtime.getURL(path) : path
      const response = await fetch(url)
      if (!response.ok) {
        return null
      }
      const bytes = await response.arrayBuffer()
      return {
        id: normalizeBookKey(openingId),
        path,
        entriesCount: entriesCountFromBuffer(bytes),
        bytes
      }
    })()

    this.loadCache.set(cacheKey, task)
    return task
  }
}

