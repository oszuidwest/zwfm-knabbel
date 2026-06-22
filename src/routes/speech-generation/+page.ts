import type { PageLoad } from './$types'
import { ApiError, isProblemDetails } from '$lib/api/client'
import { settingsApi } from '$lib/api/settings'
import { requirePermission } from '$lib/auth/guard'
import { redirectToLogin, settleLoad } from '$lib/utils/load-error'

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

  return { message: 'Spraakgeneratie laden mislukt' }
}

export const load: PageLoad = async ({ fetch, parent }) => {
  const settingsResult = settleLoad(settingsApi.getTts(fetch))

  const { user } = await parent()
  requirePermission(user, 'settings_tts', 'read')

  const result = await settingsResult
  if (result.ok) {
    return {
      settings: result.value,
      loadError: null,
    }
  }

  const err = result.err
  if (err instanceof ApiError && err.status === 401) {
    redirectToLogin(true)
  }

  return {
    settings: null,
    loadError: toSettingsLoadError(err),
  }
}
