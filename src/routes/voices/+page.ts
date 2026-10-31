import type { PageLoad } from './$types'
import { requirePermission } from '#lib/auth/guard.js'
import { getVoices } from '#lib/api/generated/sdk.gen.js'
import { settleLoad, unwrapLoadResult } from '#lib/utils/load-error.js'
import { getPaginationParams, getPaginationInfo } from '#lib/utils/pagination.js'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const responseResult = settleLoad(getVoices({ query: { limit, offset }, fetch }))

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
