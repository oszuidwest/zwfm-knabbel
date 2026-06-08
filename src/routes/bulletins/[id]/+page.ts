import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { bulletinsApi } from '$lib/api/bulletins'
import { storiesApi } from '$lib/api/stories'
import { throwResourceLoadError } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'
import type { Story } from '$lib/types'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'bulletins', 'read')

  const bulletinId = Number(params.id)

  if (isNaN(bulletinId)) {
    error(400, 'Ongeldige bulletin ID')
  }

  try {
    // Fetch bulletin and its story references in parallel
    const [bulletin, bulletinStories] = await Promise.all([
      bulletinsApi.getById(bulletinId, fetch),
      bulletinsApi.getStories(bulletinId, fetch),
    ])

    // Fetch full story details for each story in the bulletin
    const stories: Story[] = await Promise.all(
      bulletinStories.data
        .sort((a, b) => a.story_order - b.story_order)
        .map(bs => storiesApi.getById(bs.story_id, fetch))
    )

    return { bulletin, stories }
  } catch (err) {
    throwResourceLoadError(err, {
      notFound: 'Bulletin niet gevonden',
      failed: 'Bulletin laden mislukt',
    })
  }
}
