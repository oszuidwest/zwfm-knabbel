import { ApiError, apiCall, type FetchFn } from './client'
import {
  getBulletins,
  getBulletinsId,
  getBulletinsIdStories,
  getStationsIdBulletins,
  getStoriesIdBulletins,
  postStationsIdBulletins,
} from './generated/sdk.gen'
import type {
  BulletinStoriesListResponse,
  GetBulletinsData,
  GetStoriesIdBulletinsData,
} from './generated/types.gen'

export type BulletinStory = BulletinStoriesListResponse['data'][number]
export type BulletinFilters = NonNullable<GetBulletinsData['query']>

export const bulletinsApi = {
  getAll: (params?: BulletinFilters, customFetch?: FetchFn) =>
    apiCall(signal => getBulletins({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getBulletinsId({ path: { id }, fetch: customFetch, signal })),

  getLatestByStation: async (stationId: number, customFetch?: FetchFn) => {
    const response = await apiCall(signal =>
      getStationsIdBulletins({
        path: { id: stationId },
        query: { latest: true },
        fetch: customFetch,
        signal,
      })
    )

    if ('data' in response) {
      const latest = response.data[0]
      if (!latest) throw new ApiError(404, 'Bulletin not found')
      return latest
    }
    return response
  },

  generate: async (stationId: number) => {
    const response = await apiCall(signal =>
      postStationsIdBulletins({
        path: { id: stationId },
        headers: { Accept: 'application/json' },
        signal,
      })
    )
    if (response instanceof Blob) {
      throw new ApiError(0, 'Unexpected audio response')
    }
    return response
  },

  getStories: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getBulletinsIdStories({ path: { id }, fetch: customFetch, signal })),

  getByStory: (
    storyId: number,
    params?: GetStoriesIdBulletinsData['query'],
    customFetch?: FetchFn
  ) =>
    apiCall(signal =>
      getStoriesIdBulletins({
        path: { id: storyId },
        query: params,
        fetch: customFetch,
        signal,
      })
    ),
}
