import type { PageLoad } from './$types'
import { requirePermission } from '#lib/auth/guard.js'
import { getVoices } from '#lib/api/generated/sdk.gen.js'
import { settleLoad, unwrapLoadResult } from '#lib/utils/load-error.js'

export const load: PageLoad = async ({ fetch, parent }) => {
  const responseResult = settleLoad(getVoices({ fetch }))

  const { user } = await parent()
  requirePermission(user, 'stories', 'write')

  const response = unwrapLoadResult(await responseResult, {
    notFound: 'Stemmen niet gevonden',
    failed: 'Stemmen laden mislukt',
  })

  return {
    voices: response.data,
  }
}
