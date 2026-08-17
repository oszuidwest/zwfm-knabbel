import { apiCall, type FetchFn } from './client'
import {
  deleteStationsId,
  getStations,
  getStationsId,
  postStations,
  putStationsId,
} from './generated/sdk.gen'
import type { GetStationsData, StationInput } from './generated/types.gen'

type StationFilters = GetStationsData['query']

export const stationsApi = {
  getAll: (params?: StationFilters, customFetch?: FetchFn) =>
    apiCall(signal => getStations({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getStationsId({ path: { id }, fetch: customFetch, signal })),

  create: (data: StationInput) => apiCall(signal => postStations({ body: data, signal })),

  update: (id: number, data: StationInput) =>
    apiCall(signal => putStationsId({ body: data, path: { id }, signal })),

  delete: (id: number) => apiCall(signal => deleteStationsId({ path: { id }, signal })),
}
