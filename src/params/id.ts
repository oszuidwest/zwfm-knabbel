import type { ParamMatcher } from '@sveltejs/kit'

// Babbel IDs are positive integers. IDs above MAX_SAFE_INTEGER lose precision in
// Number(), so they 404 before a loader runs, like any other invalid ID.
export const match: ParamMatcher = param =>
  /^[1-9]\d*$/.test(param) && Number.isSafeInteger(Number(param))
