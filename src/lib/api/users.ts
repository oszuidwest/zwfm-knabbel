import { api, type FetchFn, type PaginationFilters } from './client'
import type { User, UserInput } from '$lib/types'

interface UsersResponse {
  data: User[]
  total: number
}

export const usersApi = {
  getAll: (params?: PaginationFilters, customFetch?: FetchFn) =>
    api.get<UsersResponse>('/users', params, customFetch),

  getById: (id: number, customFetch?: FetchFn) =>
    api.get<User>(`/users/${id}`, undefined, customFetch),

  create: (data: UserInput) => api.post<User>('/users', data),

  update: (id: number, data: Partial<UserInput>) => api.put<User>(`/users/${id}`, data),

  delete: (id: number) => api.delete<{ message: string }>(`/users/${id}`),
}
