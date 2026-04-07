import type { PageLoad } from './$types'
import { voicesApi } from '$lib/api/voices'
import { stationsApi } from '$lib/api/stations'
import { stationVoicesApi } from '$lib/api/station-voices'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch }) => {
  const voiceId = Number(params.id)

  if (isNaN(voiceId)) {
    error(400, 'Ongeldige stem ID')
  }

  try {
    const [voice, stationsRes, stationVoicesRes] = await Promise.all([
      voicesApi.getById(voiceId, fetch),
      stationsApi.getAll(undefined, fetch),
      stationVoicesApi.getAll({ voice_id: voiceId }, fetch),
    ])

    return {
      voice,
      stations: stationsRes.data,
      stationVoices: stationVoicesRes.data,
    }
  } catch {
    error(404, 'Stem niet gevonden')
  }
}
