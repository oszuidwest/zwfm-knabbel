import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { stationsApi } from '$lib/api/stations'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const responseResult = settleLoad(stationsApi.getAll({ limit, offset }, fetch))

  const { user } = await parent()
  requirePermission(user, 'stations', 'read')

  const response = unwrapLoadResult(await responseResult, {
    notFound: 'Zenders niet gevonden',
    failed: 'Zenders laden mislukt',
  })

  return {
    stations: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
