import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { stationsApi } from '$lib/api/stations'

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'bulletins', 'generate')

  const stationsRes = await stationsApi.getAll(undefined, fetch)

  return {
    stations: stationsRes.data,
  }
}
