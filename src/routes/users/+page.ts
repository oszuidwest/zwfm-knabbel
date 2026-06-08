import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { usersApi } from '$lib/api/users'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const responseResult = settleLoad(usersApi.getAll({ limit, offset }, fetch))

  const { user } = await parent()
  requirePermission(user, 'users', 'read')

  const response = unwrapLoadResult(await responseResult, {
    notFound: 'Gebruikers niet gevonden',
    failed: 'Gebruikers laden mislukt',
  })

  return {
    users: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
