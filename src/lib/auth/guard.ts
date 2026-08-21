import { redirect } from '@sveltejs/kit'
import { resolveInternalHref } from '$lib/utils/routes'
import { can, type Action, type Resource } from './policy'
import type { Session } from '$lib/types'

export function requirePermission<R extends Resource>(
  user: Session | null | undefined,
  resource: R,
  action: Action<R>
): asserts user is Session {
  if (!user) {
    redirect(303, resolveInternalHref('/login'))
  }

  if (!can(user, resource, action)) {
    redirect(303, resolveInternalHref('/stories?denied=1'))
  }
}
