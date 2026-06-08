import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { stationsApi } from '$lib/api/stations'
import { throwResourceLoadError } from '$lib/utils/load-error'

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'bulletins', 'generate')

  try {
    const stationsRes = await stationsApi.getAll(undefined, fetch)

    return {
      stations: stationsRes.data,
    }
  } catch (err) {
    throwResourceLoadError(err, {
      notFound: 'Zenders niet gevonden',
      failed: 'Zenders laden mislukt',
    })
  }
}
