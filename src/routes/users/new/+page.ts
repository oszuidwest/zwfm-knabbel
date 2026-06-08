import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent()
  requirePermission(user, 'users', 'write')
  return {}
}
