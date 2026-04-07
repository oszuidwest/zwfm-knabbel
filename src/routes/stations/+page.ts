import type { PageLoad } from './$types'
import { stationsApi } from '$lib/api/stations'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const response = await stationsApi.getAll({ limit, offset }, fetch)
  return {
    stations: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
