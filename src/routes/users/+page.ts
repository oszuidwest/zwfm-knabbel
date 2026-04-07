import type { PageLoad } from './$types'
import { usersApi } from '$lib/api/users'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const response = await usersApi.getAll({ limit, offset }, fetch)
  return {
    users: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
