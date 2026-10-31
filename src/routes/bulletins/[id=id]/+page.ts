import type { PageLoad } from './$types'
import { requirePermission } from '#lib/auth/guard.js'
import { getBulletinsId, getBulletinsIdStories, getStoriesId } from '#lib/api/generated/sdk.gen.js'
import { settleLoad, unwrapLoadResult } from '#lib/utils/load-error.js'
import type { Story } from '#lib/types/index.js'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const bulletinId = Number(params.id)

  const responseResult = settleLoad(
    Promise.all([
      getBulletinsId({ path: { id: bulletinId }, fetch }),
      getBulletinsIdStories({ path: { id: bulletinId }, fetch }),
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
        .map(bs => getStoriesId({ path: { id: bs.story_id }, fetch }))
    )
  )

  const stories: Story[] = unwrapLoadResult(storiesResult, {
    notFound: 'Bulletin niet gevonden',
    failed: 'Bulletin laden mislukt',
  })

  return { bulletin, stories }
}
