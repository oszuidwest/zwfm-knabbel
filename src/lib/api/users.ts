import { apiCall, type FetchFn } from './client'
import { deleteUsersId, getUsers, getUsersId, postUsers, putUsersId } from './generated/sdk.gen'
import type { GetUsersData } from './generated/types.gen'
import type { UserInput, UserUpdate } from '$lib/types'

type UserFilters = GetUsersData['query']

export const usersApi = {
  getAll: (params?: UserFilters, customFetch?: FetchFn) =>
    apiCall(signal => getUsers({ query: params, fetch: customFetch, signal })),

  getById: (id: number, customFetch?: FetchFn) =>
    apiCall(signal => getUsersId({ path: { id }, fetch: customFetch, signal })),

  create: (data: UserInput) => apiCall(signal => postUsers({ body: data, signal })),

  update: (id: number, data: UserUpdate) =>
    apiCall(signal => putUsersId({ body: data, path: { id }, signal })),

  delete: (id: number) => apiCall(signal => deleteUsersId({ path: { id }, signal })),
}
