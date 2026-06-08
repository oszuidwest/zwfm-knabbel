import { redirect } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'
import { authApi } from '$lib/api/auth'
import { resolveInternalHref } from '$lib/utils/routes'
import type { User } from '$lib/types'
import type { LayoutLoad } from './$types'

const PUBLIC_PREFIXES = ['/login', '/auth/oauth/callback']

// SPA mode - disable SSR
export const ssr = false
export const prerender = false

export const load: LayoutLoad = async ({ fetch, url }) => {
  if (url.pathname.startsWith('/auth/oauth/callback')) {
    return { user: null as User | null }
  }

  let user: User | null = null
  try {
    user = await authApi.getMe(fetch)
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err
    }
  }

  const isPublic = PUBLIC_PREFIXES.some(pathname => url.pathname.startsWith(pathname))

  if (user && url.pathname === '/login') {
    throw redirect(303, resolveInternalHref('/stories'))
  }

  if (!user && !isPublic) {
    throw redirect(303, resolveInternalHref('/login'))
  }

  return { user }
}
