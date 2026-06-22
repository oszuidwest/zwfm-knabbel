import type { ZodSchema } from 'zod'

export type ValidationResult<T> =
  | { success: true; data: T; errors: Record<string, never> }
  | { success: false; data: undefined; errors: Record<string, string> }

/**
 * validateForm validates data with Zod and returns one display error per field.
 *
 * @example
 * ```typescript
 * const result = validateForm(stationSchema, form)
 * if (!result.success) {
 *   errors = result.errors
 *   return
 * }
 * // result.data is typed as StationFormData
 * ```
 */
export function validateForm<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data, errors: {} as Record<string, never> }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    // Keep the first message stable so fields do not flicker between errors.
    if (!errors[field]) {
      errors[field] = issue.message
    }
  }

  return { success: false, data: undefined, errors }
}
