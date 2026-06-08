import { redirect } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'
import { settingsApi } from '$lib/api/settings'
import { resolveInternalHref } from '$lib/utils/routes'
import type { PronunciationRulesList } from '$lib/types'
import type { PageLoad } from './$types'

export interface TTSUnavailable {
  detail: string
  hint?: string
}

interface ProblemDetails {
  detail?: string
  hint?: string
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return typeof value === 'object' && value !== null
}

const emptyRules: PronunciationRulesList = {
  rules: [],
  latest_version_id: null,
  created_at: null,
}

export const load: PageLoad = async ({ fetch }) => {
  try {
    const initial = await settingsApi.getTtsPronunciations(fetch)
    return { initial, ttsUnavailable: null as TTSUnavailable | null }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw redirect(303, resolveInternalHref('/login'))
    }

    if (err instanceof ApiError && err.status === 501) {
      const details = isProblemDetails(err.details) ? err.details : undefined
      return {
        initial: emptyRules,
        ttsUnavailable: {
          detail: details?.detail ?? 'Text-to-speech is niet geconfigureerd op de server.',
          hint: details?.hint,
        } satisfies TTSUnavailable,
      }
    }

    throw err
  }
}
