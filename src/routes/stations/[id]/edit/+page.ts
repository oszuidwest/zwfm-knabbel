import type { PageLoad } from './$types'
import { stationsApi } from '$lib/api/stations'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch }) => {
  const stationId = Number(params.id)

  if (isNaN(stationId)) {
    error(400, 'Ongeldige zender ID')
  }

  try {
    const station = await stationsApi.getById(stationId, fetch)
    return { station }
  } catch {
    error(404, 'Zender niet gevonden')
  }
}
