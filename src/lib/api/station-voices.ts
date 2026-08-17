import { ApiError, apiCall, type FetchFn } from './client'
import {
  deleteStationVoicesId,
  getStationVoices,
  getStationVoicesId,
  postStationVoices,
  postStationVoicesIdAudio,
  putStationVoicesId,
} from './generated/sdk.gen'
import type {
  GetStationVoicesData,
  PostStationVoicesData,
  PutStationVoicesIdData,
} from './generated/types.gen'

export type StationVoiceInput = PostStationVoicesData['body']
export type StationVoiceFilters = NonNullable<GetStationVoicesData['query']>

export const stationVoicesApi = {
  getAll: (params?: StationVoiceFilters, customFetch?: FetchFn) =>
    apiCall(signal => getStationVoices({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getStationVoicesId({ path: { id }, fetch: customFetch, signal })),

  create: async (data: StationVoiceInput) => {
    const response = await apiCall(signal => postStationVoices({ body: data, signal }))
    if (typeof response.id !== 'number') {
      throw new ApiError(0, 'Invalid station-voice response')
    }
    return { ...response, id: response.id }
  },

  update: (id: number, data: PutStationVoicesIdData['body']) =>
    apiCall(signal => putStationVoicesId({ body: data, path: { id }, signal })),

  delete: (id: number) => apiCall(signal => deleteStationVoicesId({ path: { id }, signal })),

  uploadJingle: (id: number, file: File) =>
    apiCall(signal => postStationVoicesIdAudio({ body: { jingle: file }, path: { id }, signal }), {
      upload: true,
    }),
}
