import { api, type FetchFn } from './client'
import type {
  PronunciationRulesList,
  PronunciationRulesUpdate,
  TTSSettings,
  TTSSettingsUpdate,
} from '$lib/types'

export const settingsApi = {
  getTts: (customFetch?: FetchFn) => api.get<TTSSettings>('/settings/tts', undefined, customFetch),

  updateTts: (data: TTSSettingsUpdate, customFetch?: FetchFn) =>
    api.patch<TTSSettings>('/settings/tts', data, customFetch),

  getTtsPronunciations: (customFetch?: FetchFn) =>
    api.get<PronunciationRulesList>('/settings/tts/pronunciations', undefined, customFetch),

  updateTtsPronunciations: (data: PronunciationRulesUpdate, customFetch?: FetchFn) =>
    api.put<PronunciationRulesList>('/settings/tts/pronunciations', data, customFetch),
}
