import openingsData from '../../data/openings.json'
import type { Opening } from './schema'
import type { PositionSnapshot } from '../../shared/types'
import { applyOpeningsFilters } from './filters'
import { rankByMovePrefix } from './recommend'
import { BookService } from '../books/service'

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
      const haystack = [opening.name, opening.eco, ...(opening.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }

  recommendByPosition(snapshot: PositionSnapshot | null): Opening[] {
    if (!snapshot) {
      return []
    }
    const ranked = rankByMovePrefix(openings, snapshot.moves)
    return ranked.slice(0, 10).map((result) => result.opening)
  }

  recommendByPositionWithBooks(snapshot: PositionSnapshot | null): Array<{
    opening: Opening
    bookPath: string | null
    hasBook: boolean
  }> {
    const recommended = this.recommendByPosition(snapshot)
    return recommended.map((opening) => {
      const bookPath = bookService.resolveBookPathForOpening(opening)
      return {
        opening,
        bookPath,
        hasBook: bookPath !== null
      }
    })
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
