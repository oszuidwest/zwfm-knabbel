import type { PageLoad } from './$types'
import { getStationsId } from '$lib/api/generated/sdk.gen'
import { requirePermission } from '$lib/auth/guard'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const stationId = Number(params.id)

  const stationResult = settleLoad(getStationsId({ path: { id: stationId }, fetch }))

  const { user } = await parent()
  requirePermission(user, 'stations', 'read')

  const station = unwrapLoadResult(await stationResult, {
    notFound: 'Zender niet gevonden',
    failed: 'Zender laden mislukt',
  })

  return { station }
}
