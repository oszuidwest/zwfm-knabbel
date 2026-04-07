import type { PageLoad } from './$types'
import { voicesApi } from '$lib/api/voices'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'

export const load: PageLoad = async ({ fetch, url }) => {
  const { page, limit, offset } = getPaginationParams(url.searchParams)
  const response = await voicesApi.getAll({ limit, offset }, fetch)
  return {
    voices: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
