import type { PageLoad } from './$types'
import { ApiError } from '$lib/api/client'
import { requirePermission } from '$lib/auth/guard'
import type { BulletinFilters } from '$lib/api/bulletins'
import {
  getBulletins,
  getBulletinsIdStories,
  getStations,
  getStoriesId,
} from '$lib/api/generated/sdk.gen'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'
import type { Bulletin } from '$lib/types'

export interface BulletinWithVoice extends Bulletin {
  voice_name?: string
}

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const stationParam = url.searchParams.get('station')
  const stationId = stationParam ? Number(stationParam) : undefined

  const { page, limit, offset } = getPaginationParams(url.searchParams)

  const params: BulletinFilters = { limit, offset }
  if (stationId) {
    params.filter = { station_id: stationId }
  }

  const responseResult = settleLoad(
    Promise.all([getBulletins({ query: params, fetch }), getStations({ fetch })])
  )

  const { user } = await parent()
  requirePermission(user, 'bulletins', 'read')

  const [bulletinsRes, stationsRes] = unwrapLoadResult(await responseResult, {
    notFound: 'Bulletins niet gevonden',
    failed: 'Bulletins laden mislukt',
  })

  const bulletinsWithVoiceResult = await settleLoad(
    Promise.all(
      bulletinsRes.data.map(async bulletin => {
        try {
          const storiesRes = await getBulletinsIdStories({ path: { id: bulletin.id }, fetch })
          if (storiesRes.data.length > 0) {
            const firstStory = await getStoriesId({
              path: { id: storiesRes.data[0].story_id },
              fetch,
            })
            return { ...bulletin, voice_name: firstStory.voice_name ?? undefined }
          }
        } catch (err) {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            throw err
          }
          console.warn('[bulletins] voice name lookup failed', err)
          // Voice names are an enhancement; keep the bulletin list available on lookup failures.
        }
        return bulletin
      })
    )
  )

  const bulletinsWithVoice: BulletinWithVoice[] = unwrapLoadResult(bulletinsWithVoiceResult, {
    notFound: 'Bulletins niet gevonden',
    failed: 'Bulletins laden mislukt',
  })

  return {
    bulletins: bulletinsWithVoice,
    stations: stationsRes.data,
    pagination: getPaginationInfo(bulletinsRes.total, page, limit),
  }
}
