import type { ZodSchema } from 'zod'

export type ValidationResult<T> =
  | { success: true; data: T; errors: Record<string, never> }
  | { success: false; data: undefined; errors: Record<string, string> }

export function validateForm<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data, errors: {} }
  }

  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    if (!errors[field]) {
      errors[field] = issue.message
    }
  }

  return { success: false, data: undefined, errors }
}
