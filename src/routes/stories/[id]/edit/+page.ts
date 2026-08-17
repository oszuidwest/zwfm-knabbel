import type { PageLoad } from './$types'
import { getStoriesId, getStoriesIdBulletins, getVoices } from '$lib/api/generated/sdk.gen'
import { requirePermission } from '$lib/auth/guard'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'

const BULLETINS_PAGE_SIZE = 20

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const storyId = Number(params.id)

  if (isNaN(storyId)) {
    error(400, 'Ongeldige bericht ID')
  }

  const responseResult = settleLoad(
    Promise.all([
      getStoriesId({ path: { id: storyId }, fetch }),
      getVoices({ fetch }),
      getStoriesIdBulletins({
        path: { id: storyId },
        query: { limit: BULLETINS_PAGE_SIZE },
        fetch,
      }),
    ])
  )

  const { user } = await parent()
  requirePermission(user, 'stories', 'read')

  const [story, voicesRes, bulletinsRes] = unwrapLoadResult(await responseResult, {
    notFound: 'Bericht niet gevonden',
    failed: 'Bericht laden mislukt',
  })

  return {
    story,
    voices: voicesRes.data,
    bulletins: bulletinsRes.data,
    bulletinsTotal: bulletinsRes.total,
    bulletinsPageSize: BULLETINS_PAGE_SIZE,
  }
}
