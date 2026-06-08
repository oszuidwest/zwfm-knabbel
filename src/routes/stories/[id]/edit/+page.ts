import type { PageLoad } from './$types'
import { storiesApi } from '$lib/api/stories'
import { voicesApi } from '$lib/api/voices'
import { bulletinsApi } from '$lib/api/bulletins'
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
      storiesApi.getById(storyId, fetch),
      voicesApi.getAll(undefined, fetch),
      bulletinsApi.getByStory(storyId, { limit: BULLETINS_PAGE_SIZE }, fetch),
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
