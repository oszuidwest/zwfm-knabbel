import type { PageLoad } from './$types'
import { stationsApi } from '$lib/api/stations'

export const load: PageLoad = async ({ fetch }) => {
  const stationsRes = await stationsApi.getAll(undefined, fetch)

  return {
    stations: stationsRes.data,
  }
}
