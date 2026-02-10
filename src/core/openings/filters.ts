import type { Opening, OpeningsFilters } from './schema'

export function applyOpeningsFilters(openings: Opening[], filters: OpeningsFilters): Opening[] {
  return openings.filter((opening) => {
    if (filters.ratingBand && opening.ratingBand !== filters.ratingBand) {
      return false
    }
    if (filters.types && filters.types.length > 0) {
      if (!opening.type || !filters.types.includes(opening.type)) {
        return false
      }
    }
    if (filters.difficulties && filters.difficulties.length > 0) {
      if (!opening.difficulty || !filters.difficulties.includes(opening.difficulty)) {
        return false
      }
    }
    if (filters.tags && filters.tags.length > 0) {
      const tags = opening.tags ?? []
      const matches = filters.tags.some((tag) => tags.includes(tag))
      if (!matches) {
        return false
      }
    }
    return true
  })
}
