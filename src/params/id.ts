import type { ParamMatcher } from '@sveltejs/kit'

// Babbel IDs are positive integers. Larger than MAX_SAFE_INTEGER would lose
// precision in Number(), so those 404 before a loader runs, like other junk.
export const match: ParamMatcher = param =>
  /^[1-9]\d*$/.test(param) && Number.isSafeInteger(Number(param))
