// This import registers timeout/error interceptors before any SDK call.
import { ApiError } from '#lib/api/client.js'
import { getSessionsCurrent } from '#lib/api/generated/sdk.gen.js'
import { AUTH_DEPENDENCY } from '#lib/auth/session.js'
import type { Session } from '#lib/types/index.js'
import type { LayoutLoad } from './$types'

// Client-only rendering keeps session state owned by the browser/API session.
export const ssr = false
export const prerender = false

export const load: LayoutLoad = async ({ fetch, depends }) => {
  depends(AUTH_DEPENDENCY)

  let user: Session | null = null
  try {
    user = await getSessionsCurrent({ fetch })
  } catch (err) {
    // Only 401 means anonymous.
    if (!(err instanceof ApiError) || err.status !== 401) {
      throw err
    }
  }

  return { user }
}
