import type { ProblemDetails } from '$lib/api/client'

export const TTS_UNAVAILABLE_FALLBACK = 'Text-to-speech is niet geconfigureerd op de server.'

export interface TTSUnavailable {
  detail: string
  hint?: string
}

export function createTTSUnavailable(details?: ProblemDetails): TTSUnavailable {
  return {
    detail: details?.detail ?? TTS_UNAVAILABLE_FALLBACK,
    hint: details?.hint,
  }
}
