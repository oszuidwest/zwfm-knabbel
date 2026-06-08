import type { PageLoad } from './$types'
import { usersApi } from '$lib/api/users'
import { requirePermission } from '$lib/auth/guard'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'users', 'read')

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
