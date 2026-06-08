import { ApiError } from '$lib/api/client'
import { authApi } from '$lib/api/auth'
import { AUTH_DEPENDENCY } from '$lib/auth/session'
import type { User } from '$lib/types'
import type { LayoutLoad } from './$types'

// SPA mode - disable SSR
export const ssr = false
export const prerender = false

export const load: LayoutLoad = async ({ fetch, depends }) => {
  depends(AUTH_DEPENDENCY)

  let user: User | null = null
  try {
    user = await authApi.getMe(fetch)
  } catch (err) {
    // Alleen 401 betekent anoniem. Netwerkfouten, timeouts en 5xx blijven echte load-errors.
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err
    }
  }

  return { user }
}
