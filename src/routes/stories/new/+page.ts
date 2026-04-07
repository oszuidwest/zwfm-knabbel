import type { PageLoad } from './$types'
import { voicesApi } from '$lib/api/voices'

export const load: PageLoad = async ({ fetch }) => {
  const response = await voicesApi.getAll(undefined, fetch)
  return {
    voices: response.data,
  }
}
