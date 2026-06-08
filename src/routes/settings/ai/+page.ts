import type { PageLoad } from './$types'
import { redirect } from '@sveltejs/kit'
import { ApiError, isProblemDetails } from '$lib/api/client'
import { settingsApi } from '$lib/api/settings'
import { requirePermission } from '$lib/auth/guard'
import { resolveInternalHref } from '$lib/utils/routes'

interface SettingsLoadError {
  status?: number
  message: string
  hint?: string
}

function toSettingsLoadError(err: unknown): SettingsLoadError {
  if (err instanceof ApiError) {
    const details = isProblemDetails(err.details) ? err.details : undefined
    return {
      status: err.status || undefined,
      message: details?.detail ?? details?.title ?? err.message,
      hint: details?.hint,
    }
  }

  if (err instanceof Error) {
    return { message: err.message }
  }

  return { message: 'Spraakmodel laden mislukt' }
}

export const load: PageLoad = async ({ fetch, parent }) => {
  const { user } = await parent()
  requirePermission(user, 'settings_tts', 'read')

  try {
    return {
      settings: await settingsApi.getTts(fetch),
      loadError: null,
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw redirect(303, resolveInternalHref('/login'))
    }

    return {
      settings: null,
      loadError: toSettingsLoadError(err),
    }
  }
}
