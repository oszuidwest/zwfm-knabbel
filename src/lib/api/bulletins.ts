import { api, type FetchFn, type PaginationFilters } from './client'
import type { Bulletin } from '$lib/types'

interface BulletinsResponse {
  data: Bulletin[]
  total: number
}

export interface BulletinStory {
  id: number
  bulletin_id: number
  story_id: number
  story_order: number
  created_at: string
}

interface BulletinStoriesResponse {
  data: BulletinStory[]
  total: number
}

export interface BulletinFilters extends PaginationFilters {
  station_id?: number
}

export const bulletinsApi = {
  getAll: (params?: BulletinFilters, customFetch?: FetchFn) =>
    api.get<BulletinsResponse>('/bulletins', params, customFetch),

  getById: (id: number, customFetch?: FetchFn) =>
    api.get<Bulletin>(`/bulletins/${id}`, undefined, customFetch),

  getLatestByStation: (stationId: number, customFetch?: FetchFn) =>
    api.get<Bulletin>(`/bulletins/latest/${stationId}`, undefined, customFetch),

  generate: (stationId: number) => api.post<Bulletin>(`/stations/${stationId}/bulletins`, {}),

  getStories: (id: number, customFetch?: FetchFn) =>
    api.get<BulletinStoriesResponse>(`/bulletins/${id}/stories`, undefined, customFetch),
}
