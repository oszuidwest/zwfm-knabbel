import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { voicesApi } from '$lib/api/voices'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'voices', 'read')

  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const response = await voicesApi.getAll({ limit, offset }, fetch)
  return {
    voices: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
