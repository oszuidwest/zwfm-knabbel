import { apiCall, type FetchFn } from './client'
import {
  deleteStoriesId,
  getStories,
  getStoriesId,
  postStories,
  postStoriesIdAudio,
  putStoriesId,
} from './generated/sdk.gen'
import type { GetStoriesData, PostStoriesData, PutStoriesIdData } from './generated/types.gen'
import { weekdaysToMask, type Weekdays } from '$lib/types'
import { toNumberOrNull } from '$lib/utils/form'

export type StoryFilters = NonNullable<GetStoriesData['query']>
export type StoryCreateInput = PostStoriesData['body']

export const storiesApi = {
  getAll: (params?: StoryFilters, customFetch?: FetchFn) =>
    apiCall(signal => getStories({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getStoriesId({ path: { id }, fetch: customFetch, signal })),

  create: (data: StoryCreateInput) => apiCall(signal => postStories({ body: data, signal })),

  update: (id: number, data: PutStoriesIdData['body']) =>
    apiCall(signal => putStoriesId({ body: data, path: { id }, signal })),

  delete: (id: number) => apiCall(signal => deleteStoriesId({ path: { id }, signal })),

  uploadAudio: (id: number, file: File) =>
    apiCall(signal => postStoriesIdAudio({ body: { audio: file }, path: { id }, signal }), {
      upload: true,
    }),

  // toApiFormat keeps select-string and weekday-object UI state at the API boundary.
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
