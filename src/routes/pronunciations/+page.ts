import { ApiError, isProblemDetails } from '$lib/api/client'
import { settingsApi } from '$lib/api/settings'
import { requirePermission } from '$lib/auth/guard'
import { redirectToLogin, settleLoad } from '$lib/utils/load-error'
import type { PronunciationRulesList } from '$lib/types'
import type { PageLoad } from './$types'

interface PronunciationsLoadError {
  status?: number
  message: string
  hint?: string
}

const emptyRules: PronunciationRulesList = {
  rules: [],
  updated_at: null,
}

function toLoadError(err: ApiError): PronunciationsLoadError {
  const details = isProblemDetails(err.details) ? err.details : undefined
  if (err.status === 403) {
    return {
      status: err.status,
      message: details?.detail ?? 'Geen toegang tot uitspraakregels.',
      hint: details?.hint,
    }
  }

  return {
    status: err.status || undefined,
    message: details?.detail ?? details?.title ?? err.message,
    hint: details?.hint,
  }
}

export const load: PageLoad = async ({ fetch, parent }) => {
  const initialResult = settleLoad(settingsApi.getTtsPronunciations(fetch))

  const { user } = await parent()
  requirePermission(user, 'pronunciation_rules', 'read')

  const result = await initialResult
  if (result.ok) {
    return {
      initial: result.value,
      loadError: null as PronunciationsLoadError | null,
    }
  }

  const err = result.err
  if (err instanceof ApiError && err.status === 401) {
    redirectToLogin(true)
  }

  if (err instanceof ApiError) {
    return {
      initial: emptyRules,
      loadError: toLoadError(err),
    }
  }

  throw err
}
