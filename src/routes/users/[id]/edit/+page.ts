import type { PageLoad } from './$types'
import { usersApi } from '$lib/api/users'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch }) => {
  const userId = Number(params.id)

  if (isNaN(userId)) {
    error(400, 'Ongeldige gebruiker ID')
  }

  try {
    const user = await usersApi.getById(userId, fetch)
    return { user }
  } catch {
    error(404, 'Gebruiker niet gevonden')
  }
}
