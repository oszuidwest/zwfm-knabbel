import type { ParamMatcher } from '@sveltejs/kit'

// Reject IDs that would lose precision when converted to numbers.
export const match: ParamMatcher = param =>
  /^[1-9]\d*$/.test(param) && Number.isSafeInteger(Number(param))
