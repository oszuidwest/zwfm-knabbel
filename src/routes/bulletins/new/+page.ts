import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { getStations } from '$lib/api/generated/sdk.gen'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'

export const load: PageLoad = async ({ fetch, parent }) => {
  const stationsResult = settleLoad(getStations({ fetch }))

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
