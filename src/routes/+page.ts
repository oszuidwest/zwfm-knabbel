import type { PageLoad } from './$types'
import { ApiError } from '$lib/api/client'
import { can } from '$lib/auth/policy'
import type { StoryFilters } from '$lib/api/stories'
import {
  getBulletins,
  getStations,
  getStationsIdBulletinsLatest,
  getStories,
} from '$lib/api/generated/sdk.gen'
import { redirectToLogin, settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { toLocalDateString } from '$lib/utils/format'
import type { Bulletin, Station, Story } from '$lib/types'

export interface StationBulletin {
  station: Station
  bulletin: Bulletin | null
}

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user } = await parent()
  if (!user) {
    redirectToLogin()
  }

  const canStories = can(user, 'stories', 'read')
  const canBulletins = can(user, 'bulletins', 'read')
  const canStations = can(user, 'stations', 'read')

  // Counts come from the paginated `total` field; limit=1 with a sparse
  // fieldset keeps these requests as light as the API allows.
  const storyCount = (filter: NonNullable<StoryFilters['filter']>): Promise<number> =>
    canStories
      ? getStories({ query: { limit: 1, fields: 'id', filter }, fetch }).then(res => res.total)
      : Promise.resolve(0)

  const bulletinsToday = canBulletins
    ? getBulletins({
        query: { limit: 1, fields: 'id', filter: { created_at: { gte: toLocalDateString() } } },
        fetch,
      }).then(res => res.total)
    : Promise.resolve(0)

  const recentStories: Promise<Story[]> = canStories
    ? getStories({ query: { limit: 5, sort: 'created_at:desc' }, fetch }).then(res => res.data)
    : Promise.resolve([])

  const recentBulletins: Promise<Bulletin[]> = canBulletins
    ? getBulletins({ query: { limit: 5, sort: 'created_at:desc' }, fetch }).then(res => res.data)
    : Promise.resolve([])

  const stationBulletins: Promise<StationBulletin[]> =
    canStations && canBulletins
      ? getStations({ fetch }).then(res =>
          Promise.all(
            res.data.map(async (station): Promise<StationBulletin> => {
              try {
                const bulletin = await getStationsIdBulletinsLatest({
                  path: { id: station.id },
                  fetch,
                })
                return { station, bulletin }
              } catch (err) {
                // 404 means the station has no bulletin yet.
                if (err instanceof ApiError && err.status === 404) {
                  return { station, bulletin: null }
                }
                throw err
              }
            })
          ).then(entries =>
            // Newest bulletin first; stations without a bulletin at the end.
            entries.toSorted(
              (a, b) =>
                (b.bulletin ? Date.parse(b.bulletin.created_at) : 0) -
                (a.bulletin ? Date.parse(a.bulletin.created_at) : 0)
            )
          )
        )
      : Promise.resolve([])

  const result = await settleLoad(
    Promise.all([
      storyCount({ status: 'active' }),
      storyCount({ status: 'draft' }),
      storyCount({ status: 'active', is_breaking: true }),
      bulletinsToday,
      recentStories,
      recentBulletins,
      stationBulletins,
    ])
  )

  const [active, drafts, breaking, today, stories, bulletins, latestPerStation] = unwrapLoadResult(
    result,
    {
      notFound: 'Dashboard niet gevonden',
      failed: 'Dashboard laden mislukt',
    }
  )

  return {
    canStories,
    canBulletins,
    stats: { active, drafts, breaking, today },
    recentStories: stories,
    recentBulletins: bulletins,
    stationBulletins: latestPerStation,
  }
}
