import { DEFAULT_SETTINGS } from '../shared/constants'
import type { UserSettings } from '../shared/types'

const FAVORITES_KEY = 'favorites'
const SETTINGS_KEY = 'settings'

function normalizeFavoriteId(id: string): string {
  return id.trim().toLowerCase()
}

export class FavoritesRepo {
  async list(): Promise<string[]> {
    const result = await chrome.storage.local.get(FAVORITES_KEY)
    const raw = (result[FAVORITES_KEY] as string[] | undefined) ?? []
    const unique = new Set<string>()
    for (const item of raw) {
      if (typeof item !== 'string') {
        continue
      }
      const normalized = normalizeFavoriteId(item)
      if (!normalized) {
        continue
      }
      unique.add(normalized)
    }
    return [...unique]
  }

  async add(id: string): Promise<void> {
    const normalized = normalizeFavoriteId(id)
    if (!normalized) {
      return
    }
    const current = await this.list()
    if (!current.includes(normalized)) {
      await chrome.storage.local.set({ [FAVORITES_KEY]: [...current, normalized] })
    }
  }

  async remove(id: string): Promise<void> {
    const normalized = normalizeFavoriteId(id)
    if (!normalized) {
      return
    }
    const current = await this.list()
    await chrome.storage.local.set({
      [FAVORITES_KEY]: current.filter((item) => normalizeFavoriteId(item) !== normalized)
    })
  }
}

export class SettingsRepo {
  async get(): Promise<UserSettings> {
    const result = await chrome.storage.local.get(SETTINGS_KEY)
    return (result[SETTINGS_KEY] as UserSettings | undefined) ?? DEFAULT_SETTINGS
  }

  async set(next: UserSettings): Promise<void> {
    await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  }
}
