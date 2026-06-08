import type { PageLoad } from './$types'
import { storiesApi } from '$lib/api/stories'
import { voicesApi } from '$lib/api/voices'
import { bulletinsApi } from '$lib/api/bulletins'
import { requirePermission } from '$lib/auth/guard'
import { throwResourceLoadError } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'

const BULLETINS_PAGE_SIZE = 20

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'stories', 'read')

  const storyId = Number(params.id)

  if (isNaN(storyId)) {
    error(400, 'Ongeldige bericht ID')
  }

  try {
    const [story, voicesRes, bulletinsRes] = await Promise.all([
      storiesApi.getById(storyId, fetch),
      voicesApi.getAll(undefined, fetch),
      bulletinsApi.getByStory(storyId, { limit: BULLETINS_PAGE_SIZE }, fetch),
    ])

    return {
      story,
      voices: voicesRes.data,
      bulletins: bulletinsRes.data,
      bulletinsTotal: bulletinsRes.total,
      bulletinsPageSize: BULLETINS_PAGE_SIZE,
    }
  } catch (err) {
    throwResourceLoadError(err, {
      notFound: 'Bericht niet gevonden',
      failed: 'Bericht laden mislukt',
    })
  }
}
