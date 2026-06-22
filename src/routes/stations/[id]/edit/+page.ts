import type { PageLoad } from './$types'
import { stationsApi } from '$lib/api/stations'
import { requirePermission } from '$lib/auth/guard'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const stationId = Number(params.id)

  if (isNaN(stationId)) {
    error(400, 'Ongeldige zender ID')
  }

  const stationResult = settleLoad(stationsApi.getById(stationId, fetch))

  const { user } = await parent()
  requirePermission(user, 'stations', 'read')

  const station = unwrapLoadResult(await stationResult, {
    notFound: 'Zender niet gevonden',
    failed: 'Zender laden mislukt',
  })

  return { station }
}
