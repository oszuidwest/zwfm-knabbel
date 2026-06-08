import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { stationsApi } from '$lib/api/stations'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'

export const load: PageLoad = async ({ fetch, parent }) => {
  const stationsResult = settleLoad(stationsApi.getAll(undefined, fetch))

  const { user } = await parent()
  requirePermission(user, 'bulletins', 'generate')

  const stationsRes = unwrapLoadResult(await stationsResult, {
    notFound: 'Zenders niet gevonden',
    failed: 'Zenders laden mislukt',
  })

  return {
    stations: stationsRes.data,
  }
}
