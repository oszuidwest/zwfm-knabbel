import type { PageLoad } from './$types'
import { stationsApi } from '$lib/api/stations'
import { requirePermission } from '$lib/auth/guard'
import { throwResourceLoadError } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'stations', 'read')

  const stationId = Number(params.id)

  if (isNaN(stationId)) {
    error(400, 'Ongeldige zender ID')
  }

  try {
    const station = await stationsApi.getById(stationId, fetch)
    return { station }
  } catch (err) {
    throwResourceLoadError(err, {
      notFound: 'Zender niet gevonden',
      failed: 'Zender laden mislukt',
    })
  }
}
