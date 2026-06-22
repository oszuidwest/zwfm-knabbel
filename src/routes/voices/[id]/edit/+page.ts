import type { PageLoad } from './$types'
import { voicesApi } from '$lib/api/voices'
import { stationsApi } from '$lib/api/stations'
import { stationVoicesApi } from '$lib/api/station-voices'
import { requirePermission } from '$lib/auth/guard'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const voiceId = Number(params.id)

  if (isNaN(voiceId)) {
    error(400, 'Ongeldige stem ID')
  }

  const responseResult = settleLoad(
    Promise.all([
      voicesApi.getById(voiceId, fetch),
      stationsApi.getAll(undefined, fetch),
      stationVoicesApi.getAll({ voice_id: voiceId }, fetch),
    ])
  )

  const { user } = await parent()
  requirePermission(user, 'voices', 'read')

  const [voice, stationsRes, stationVoicesRes] = unwrapLoadResult(await responseResult, {
    notFound: 'Stem niet gevonden',
    failed: 'Stem laden mislukt',
  })

  return {
    voice,
    stations: stationsRes.data,
    stationVoices: stationVoicesRes.data,
  }
}
