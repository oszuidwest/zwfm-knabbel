import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { voicesApi } from '$lib/api/voices'

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'stories', 'write')

  const response = await voicesApi.getAll(undefined, fetch)
  return {
    voices: response.data,
  }
}
