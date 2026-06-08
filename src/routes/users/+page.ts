import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { usersApi } from '$lib/api/users'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'users', 'read')

  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const response = await usersApi.getAll({ limit, offset }, fetch)
  return {
    users: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
