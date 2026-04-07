import { api, type FetchFn, type PaginationFilters } from './client'
import type { Story } from '$lib/types'
import { weekdaysToMask, type Weekdays } from '$lib/types'
import { toNumberOrNull } from '$lib/utils/form'

interface StoriesResponse {
  data: Story[]
  total: number
}

export interface StoryFilters extends PaginationFilters {
  search?: string
  'filter[status]'?: string
  'filter[start_date][lte]'?: string
  'filter[end_date][gte]'?: string
  'filter[weekdays][band]'?: number
  'filter[audio_url][ne]'?: string
  'filter[audio_url]'?: string
}

export interface StoryCreateInput {
  title: string
  text: string
  voice_id?: number | null
  status: 'draft' | 'active' | 'expired'
  start_date: string
  end_date: string
  weekdays: number
  is_breaking: boolean
}

export const storiesApi = {
  getAll: (params?: StoryFilters, customFetch?: FetchFn) =>
    api.get<StoriesResponse>('/stories', params, customFetch),

  getById: (id: number, customFetch?: FetchFn) =>
    api.get<Story>(`/stories/${id}`, undefined, customFetch),

  create: (data: StoryCreateInput) => api.post<Story>('/stories', data),

  update: (id: number, data: Partial<StoryCreateInput>) => api.put<Story>(`/stories/${id}`, data),

  delete: (id: number) => api.delete<{ message: string }>(`/stories/${id}`),

  uploadAudio: (id: number, file: File) => api.upload<Story>(`/stories/${id}/audio`, file),

  // Helper to convert form data with Weekdays object to API format
  // Handles string → number conversion for voice_id (HTML select returns strings)
  toApiFormat: (data: {
    title: string
    text: string
    voice_id?: string | null
    status: 'draft' | 'active' | 'expired'
    start_date: string
    end_date: string
    weekdays: Weekdays
    is_breaking: boolean
  }): StoryCreateInput => ({
    title: data.title,
    text: data.text,
    voice_id: toNumberOrNull(data.voice_id),
    status: data.status,
    start_date: data.start_date,
    end_date: data.end_date,
    weekdays: weekdaysToMask(data.weekdays),
    is_breaking: data.is_breaking,
  }),
}
