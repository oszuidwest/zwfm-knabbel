import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { stationsApi } from '$lib/api/stations'
import { throwResourceLoadError } from '$lib/utils/load-error'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'stations', 'read')

  const { page, limit, offset } = getPaginationParams(url.searchParams)

  try {
    const response = await stationsApi.getAll({ limit, offset }, fetch)
    return {
      stations: response.data,
      pagination: getPaginationInfo(response.total, page, limit),
    }
  } catch (err) {
    throwResourceLoadError(err, {
      notFound: 'Zenders niet gevonden',
      failed: 'Zenders laden mislukt',
    })
  }
}
