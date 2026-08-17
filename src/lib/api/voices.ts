import { apiCall, type FetchFn } from './client'
import {
  deleteVoicesId,
  getVoices,
  getVoicesId,
  postVoices,
  putVoicesId,
} from './generated/sdk.gen'
import type { GetVoicesData } from './generated/types.gen'
import type { VoiceInput } from '$lib/types'

type VoiceFilters = GetVoicesData['query']

export const voicesApi = {
  getAll: (params?: VoiceFilters, customFetch?: FetchFn) =>
    apiCall(signal => getVoices({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getVoicesId({ path: { id }, fetch: customFetch, signal })),

  create: (data: VoiceInput) => apiCall(signal => postVoices({ body: data, signal })),

  update: (id: number, data: VoiceInput) =>
    apiCall(signal => putVoicesId({ body: data, path: { id }, signal })),

  delete: (id: number) => apiCall(signal => deleteVoicesId({ path: { id }, signal })),
}
