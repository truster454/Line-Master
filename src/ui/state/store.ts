import type { Opening } from '../../core/openings/schema'
import type { PositionSnapshot } from '../../shared/types'

export interface UIState {
  position: PositionSnapshot | null
  favorites: string[]
  openings: Opening[]
}

export const defaultUIState: UIState = {
  position: null,
  favorites: [],
  openings: []
}

export function getInitialState(): UIState {
  return { ...defaultUIState }
}
