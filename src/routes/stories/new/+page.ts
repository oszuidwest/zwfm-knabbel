import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { voicesApi } from '$lib/api/voices'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'

export const load: PageLoad = async ({ fetch, parent }) => {
  const responseResult = settleLoad(voicesApi.getAll(undefined, fetch))

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
