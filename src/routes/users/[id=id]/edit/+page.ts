import type { PageLoad } from './$types'
import { getUsersId } from '#lib/api/generated/sdk.gen.js'
import { requirePermission } from '#lib/auth/guard.js'
import { settleLoad, unwrapLoadResult } from '#lib/utils/load-error.js'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const userId = Number(params.id)

  const userResult = settleLoad(getUsersId({ path: { id: userId }, fetch }))

  const { user } = await parent()
  requirePermission(user, 'users', 'read')

  const loadedUser = unwrapLoadResult(await userResult, {
    notFound: 'Gebruiker niet gevonden',
    failed: 'Gebruiker laden mislukt',
  })

  return { user: loadedUser }
}
