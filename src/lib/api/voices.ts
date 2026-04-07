import { api, type FetchFn, type PaginationFilters } from './client'
import type { Voice, VoiceInput } from '$lib/types'

interface VoicesResponse {
  data: Voice[]
  total: number
}

export const voicesApi = {
  getAll: (params?: PaginationFilters, customFetch?: FetchFn) =>
    api.get<VoicesResponse>('/voices', params, customFetch),

  getById: (id: number, customFetch?: FetchFn) =>
    api.get<Voice>(`/voices/${id}`, undefined, customFetch),

  create: (data: VoiceInput) => api.post<Voice>('/voices', data),

  update: (id: number, data: VoiceInput) => api.put<Voice>(`/voices/${id}`, data),

  delete: (id: number) => api.delete<{ message: string }>(`/voices/${id}`),
}
