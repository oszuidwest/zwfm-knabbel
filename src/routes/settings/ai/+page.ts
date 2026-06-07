import type { PageLoad } from './$types'
import { ApiError } from '$lib/api/client'
import { settingsApi } from '$lib/api/settings'

interface SettingsLoadError {
  status?: number
  message: string
  hint?: string
}

interface ProblemDetails {
  detail?: string
  title?: string
  hint?: string
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null
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

  return { message: 'AI-instellingen laden mislukt' }
}

export const load: PageLoad = async ({ fetch }) => {
  try {
    return {
      settings: await settingsApi.getTts(fetch),
      loadError: null,
    }
  } catch (err) {
    return {
      settings: null,
      loadError: toSettingsLoadError(err),
    }
  }
}
