import { api, type FetchFn } from './client'
import type { StationVoice } from '$lib/types'

interface StationVoicesResponse {
  data: StationVoice[]
  total: number
}

export interface StationVoiceInput {
  station_id: number
  voice_id: number
  mix_point?: number
}

export const stationVoicesApi = {
  getAll: (params?: { station_id?: number; voice_id?: number }, customFetch?: FetchFn) => {
    const filterParams: Record<string, string | number> = {}
    if (params?.station_id !== undefined) {
      filterParams['filter[station_id]'] = params.station_id
    }
    if (params?.voice_id !== undefined) {
      filterParams['filter[voice_id]'] = params.voice_id
    }
    return api.get<StationVoicesResponse>(
      '/station-voices',
      Object.keys(filterParams).length > 0 ? filterParams : undefined,
      customFetch
    )
  },

  getById: (id: number, customFetch?: FetchFn) =>
    api.get<StationVoice>(`/station-voices/${id}`, undefined, customFetch),

  create: (data: StationVoiceInput) =>
    api.post<{ id: number; message: string }>('/station-voices', data),

  update: (id: number, data: Partial<StationVoiceInput>) =>
    api.put<{ message: string }>(`/station-voices/${id}`, data),

  delete: (id: number) => api.delete<{ message: string }>(`/station-voices/${id}`),

  uploadJingle: (id: number, file: File) =>
    api.upload<{ message: string }>(`/station-voices/${id}/audio`, file, 'jingle'),
}
