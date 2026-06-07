import { api, type FetchFn } from './client'
import type { TTSSettings, TTSSettingsUpdate } from '$lib/types'

export const settingsApi = {
  getTts: (customFetch?: FetchFn) => api.get<TTSSettings>('/settings/tts', undefined, customFetch),

  updateTts: (data: TTSSettingsUpdate, customFetch?: FetchFn) =>
    api.patch<TTSSettings>('/settings/tts', data, customFetch),
}
