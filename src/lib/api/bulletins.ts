import { ApiError, apiCall, type FetchFn } from './client'
import {
  getBulletins,
  getBulletinsId,
  getBulletinsIdStories,
  getStoriesIdBulletins,
  postStationsIdBulletins,
} from './generated/sdk.gen'
import type { GetBulletinsData, GetStoriesIdBulletinsData } from './generated/types.gen'

export type BulletinFilters = NonNullable<GetBulletinsData['query']>

export const bulletinsApi = {
  getAll: (params?: BulletinFilters, customFetch?: FetchFn) =>
    apiCall(signal => getBulletins({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getBulletinsId({ path: { id }, fetch: customFetch, signal })),

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
