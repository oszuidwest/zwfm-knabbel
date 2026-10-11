import type { PageLoad } from './$types'
import { getUsersId } from '$lib/api/generated/sdk.gen'
import { requirePermission } from '$lib/auth/guard'
import { settleLoad, unwrapLoadResult } from '$lib/utils/load-error'

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
