import type { PageLoad } from './$types'
import { requirePermission } from '$lib/auth/guard'
import { voicesApi } from '$lib/api/voices'
import { throwResourceLoadError } from '$lib/utils/load-error'

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'stories', 'write')

  try {
    const response = await voicesApi.getAll(undefined, fetch)
    return {
      voices: response.data,
    }
  } catch (err) {
    throwResourceLoadError(err, {
      notFound: 'Stemmen niet gevonden',
      failed: 'Stemmen laden mislukt',
    })
  }
}
