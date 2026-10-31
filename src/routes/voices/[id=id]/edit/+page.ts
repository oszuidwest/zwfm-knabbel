import type { PageLoad } from './$types'
import { getStationVoices, getStations, getVoicesId } from '#lib/api/generated/sdk.gen.js'
import { requirePermission } from '#lib/auth/guard.js'
import { settleLoad, unwrapLoadResult } from '#lib/utils/load-error.js'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const voiceId = Number(params.id)

  const responseResult = settleLoad(
    Promise.all([
      getVoicesId({ path: { id: voiceId }, fetch }),
      getStations({ fetch }),
      getStationVoices({ query: { filter: { voice_id: voiceId } }, fetch }),
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
