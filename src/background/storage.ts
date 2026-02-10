import { DEFAULT_SETTINGS } from '../shared/constants'
import type { UserSettings } from '../shared/types'

const FAVORITES_KEY = 'favorites'
const SETTINGS_KEY = 'settings'

export class FavoritesRepo {
  async list(): Promise<string[]> {
    const result = await chrome.storage.local.get(FAVORITES_KEY)
    return (result[FAVORITES_KEY] as string[] | undefined) ?? []
  }

  async add(id: string): Promise<void> {
    const current = await this.list()
    if (!current.includes(id)) {
      await chrome.storage.local.set({ [FAVORITES_KEY]: [...current, id] })
    }
  }

  async remove(id: string): Promise<void> {
    const current = await this.list()
    await chrome.storage.local.set({ [FAVORITES_KEY]: current.filter((item) => item !== id) })
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
