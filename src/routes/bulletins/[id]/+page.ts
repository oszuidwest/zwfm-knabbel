import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { bulletinsApi } from '$lib/api/bulletins'
import { storiesApi } from '$lib/api/stories'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'
import { error } from '@sveltejs/kit'
import type { Story } from '$lib/types'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const bulletinId = Number(params.id)

  if (isNaN(bulletinId)) {
    error(400, 'Ongeldige bulletin ID')
  }

  const responseResult = settleLoad(
    Promise.all([
      bulletinsApi.getById(bulletinId, fetch),
      bulletinsApi.getStories(bulletinId, fetch),
    ])
  )

  const { user } = await parent()
  requirePermission(user, 'bulletins', 'read')

  const [bulletin, bulletinStories] = unwrapLoadResult(await responseResult, {
    notFound: 'Bulletin niet gevonden',
    failed: 'Bulletin laden mislukt',
  })

  const storiesResult = await settleLoad(
    Promise.all(
      bulletinStories.data
        .sort((a, b) => a.story_order - b.story_order)
        .map(bs => storiesApi.getById(bs.story_id, fetch))
    )
  )

  const stories: Story[] = unwrapLoadResult(storiesResult, {
    notFound: 'Bulletin niet gevonden',
    failed: 'Bulletin laden mislukt',
  })

  return { bulletin, stories }
}
