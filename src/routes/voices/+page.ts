import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { voicesApi } from '$lib/api/voices'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const responseResult = settleLoad(voicesApi.getAll({ limit, offset }, fetch))

  const { user } = await parent()
  requirePermission(user, 'voices', 'read')

  const response = unwrapLoadResult(await responseResult, {
    notFound: 'Stemmen niet gevonden',
    failed: 'Stemmen laden mislukt',
  })

  return {
    voices: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
