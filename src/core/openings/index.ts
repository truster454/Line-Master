import openingsData from '../../data/openings.json'
import type { PositionSnapshot } from '../../shared/types'
import type { BookLookupHit } from '../books/service'
import { BookService } from '../books/service'
import { applyOpeningsFilters } from './filters'
import type { Opening } from './schema'

const openings = openingsData as Opening[]
const bookService = new BookService()

export class OpeningsService {
  listAll(): Opening[] {
    return [...openings]
  }

  getById(id: string): Opening | undefined {
    return openings.find((opening) => opening.id === id)
  }

  search(query: string): Opening[] {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return openings.slice(0, 50)
    }

    return openings.filter((opening) => {
      const haystack = [opening.id, opening.name, opening.eco, ...(opening.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }

  // Metadata hint only; actual move choice comes from bin lookup by FEN.
  recommendByPosition(snapshot: PositionSnapshot | null): Opening[] {
    if (!snapshot?.fen) {
      return []
    }
    return openings.filter((opening) => bookService.resolveBookPathForOpening(opening) !== null)
  }

  async lookupAllBooksByFen(fen: string): Promise<Array<BookLookupHit & { opening?: Opening }>> {
    const hits = await bookService.lookupAllByFen(fen)
    return hits.map((hit) => ({
      ...hit,
      opening: this.getById(hit.openingId)
    }))
  }

  async loadBookForOpeningId(openingId: string) {
    return bookService.loadBookByOpeningId(openingId)
  }

  async loadBookForOpening(opening: Opening) {
    return bookService.loadBookForOpening(opening)
  }

  listBooks() {
    return bookService.listBooks()
  }

  filter(openingsList: Opening[], filters: Parameters<typeof applyOpeningsFilters>[1]): Opening[] {
    return applyOpeningsFilters(openingsList, filters)
  }
}
