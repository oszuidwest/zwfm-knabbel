import { redirect } from '@sveltejs/kit'
import { resolveInternalHref } from '$lib/utils/routes'
import { can, type Action, type Resource } from './policy'
import type { User } from '$lib/types'

export function requirePermission<R extends Resource>(
  user: User | null | undefined,
  resource: R,
  action: Action<R>
): asserts user is User {
  if (!user) {
    throw redirect(303, resolveInternalHref('/login'))
  }

  if (!can(user.role, resource, action)) {
    throw redirect(303, resolveInternalHref('/stories?denied=1'))
  }
}
