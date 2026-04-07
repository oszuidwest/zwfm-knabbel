import { api, type FetchFn, type PaginationFilters } from './client'
import type { Station, StationInput } from '$lib/types'

interface StationsResponse {
  data: Station[]
  total: number
}

export const stationsApi = {
  getAll: (params?: PaginationFilters, customFetch?: FetchFn) =>
    api.get<StationsResponse>('/stations', params, customFetch),

  getById: (id: number, customFetch?: FetchFn) =>
    api.get<Station>(`/stations/${id}`, undefined, customFetch),

  create: (data: StationInput) => api.post<Station>('/stations', data),

  update: (id: number, data: StationInput) => api.put<Station>(`/stations/${id}`, data),

  delete: (id: number) => api.delete<{ message: string }>(`/stations/${id}`),
}
