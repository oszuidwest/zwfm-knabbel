import type { PageLoad } from './$types'
import { bulletinsApi, type BulletinFilters } from '$lib/api/bulletins'
import { stationsApi } from '$lib/api/stations'
import { storiesApi } from '$lib/api/stories'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'
import type { Bulletin } from '$lib/types'

export interface BulletinWithVoice extends Bulletin {
  voice_name?: string
}

export const load: PageLoad = async ({ fetch, url }) => {
  const stationParam = url.searchParams.get('station')
  const stationId = stationParam ? Number(stationParam) : undefined

  const { page, limit, offset } = getPaginationParams(url.searchParams)

  const params: BulletinFilters = { limit, offset }
  if (stationId) {
    params.station_id = stationId
  }

  const [bulletinsRes, stationsRes] = await Promise.all([
    bulletinsApi.getAll(params, fetch),
    stationsApi.getAll(undefined, fetch),
  ])

  // Voice name not in bulletin response — fetch via first story per bulletin
  const bulletinsWithVoice: BulletinWithVoice[] = await Promise.all(
    bulletinsRes.data.map(async bulletin => {
      try {
        const storiesRes = await bulletinsApi.getStories(bulletin.id!, fetch)
        if (storiesRes.data.length > 0) {
          const firstStory = await storiesApi.getById(storiesRes.data[0].story_id, fetch)
          return { ...bulletin, voice_name: firstStory.voice_name ?? undefined }
        }
      } catch {
        // Ignore errors, just don't add voice_name
      }
      return bulletin
    })
  )

  return {
    bulletins: bulletinsWithVoice,
    stations: stationsRes.data,
    pagination: getPaginationInfo(bulletinsRes.total, page, limit),
  }
}
