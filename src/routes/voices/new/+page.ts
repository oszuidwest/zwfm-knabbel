import type { PageLoad } from './$types'
import { requirePermission } from '#lib/auth/guard.js'

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent()
  requirePermission(user, 'voices', 'write')
  return {}
}
