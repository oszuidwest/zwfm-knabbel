import { defineParams } from '@sveltejs/kit/params'

export const params = defineParams({
  // Reject IDs that would lose precision when converted to numbers.
  id: param =>
    /^[1-9]\d*$/.test(param) && Number.isSafeInteger(Number(param)) ? param : undefined,
})
