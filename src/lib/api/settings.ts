import { apiCall, type FetchFn } from './client'
import {
  getSettingsTts,
  getSettingsTtsPronunciations,
  patchSettingsTts,
  putSettingsTtsPronunciations,
} from './generated/sdk.gen'
import type { PronunciationRulesUpdate, TTSSettingsUpdate } from '$lib/types'

export const settingsApi = {
  getTts: (customFetch?: FetchFn) =>
    apiCall(signal => getSettingsTts({ fetch: customFetch, signal })),

  updateTts: (data: TTSSettingsUpdate, customFetch?: FetchFn) =>
    apiCall(signal => patchSettingsTts({ body: data, fetch: customFetch, signal })),

  getTtsPronunciations: (customFetch?: FetchFn) =>
    apiCall(signal => getSettingsTtsPronunciations({ fetch: customFetch, signal })),

  updateTtsPronunciations: (data: PronunciationRulesUpdate, customFetch?: FetchFn) =>
    apiCall(signal => putSettingsTtsPronunciations({ body: data, fetch: customFetch, signal })),
}
