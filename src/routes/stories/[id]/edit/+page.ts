import type { PageLoad } from './$types'
import { storiesApi } from '$lib/api/stories'
import { voicesApi } from '$lib/api/voices'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch }) => {
  const storyId = Number(params.id)

  if (isNaN(storyId)) {
    error(400, 'Ongeldige bericht ID')
  }

  try {
    const [story, voicesRes] = await Promise.all([
      storiesApi.getById(storyId, fetch),
      voicesApi.getAll(undefined, fetch),
    ])

    return {
      story,
      voices: voicesRes.data,
    }
  } catch {
    error(404, 'Bericht niet gevonden')
  }
}
