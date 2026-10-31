import { ApiError, isProblemDetails } from '#lib/api/client.js'
import { getSettingsTtsPronunciations } from '#lib/api/generated/sdk.gen.js'
import { requirePermission } from '#lib/auth/guard.js'
import { redirectToLogin, settleLoad } from '#lib/utils/load-error.js'
import type { PronunciationRulesList } from '#lib/types/index.js'
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
  return {
    status: err.status || undefined,
    message:
      err.status === 403
        ? 'Geen toegang tot uitspraakregels.'
        : err.message || 'Uitspraakregels laden mislukt',
    hint: details?.hint,
  }
}

export const load: PageLoad = async ({ fetch, parent }) => {
  const initialResult = settleLoad(getSettingsTtsPronunciations({ fetch }))

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
