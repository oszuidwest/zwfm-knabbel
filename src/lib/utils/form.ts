/**
 * Form utility helpers for type-safe select inputs
 *
 * HTML <select> elements always return string values, even when the original
 * option values were numbers. These helpers provide explicit type conversion
 * to maintain type safety across the form → API boundary.
 */

/**
 * Convert an array of objects with id/name to select options with string values.
 * Use this when populating SelectInput options from API data.
 *
 * @example
 * ```ts
 * const voiceOptions = toSelectOptions(data.voices)
 * // [{ value: '1', label: 'Alice' }, { value: '2', label: 'Bob' }]
 * ```
 */
export function toSelectOptions<T extends { id?: number | null; name?: string | null }>(
  items: T[],
  labelKey: keyof T = 'name'
): { value: string; label: string }[] {
  return items
    .filter(item => item.id != null)
    .map(item => ({
      value: String(item.id),
      label: String(item[labelKey] ?? ''),
    }))
}

/**
 * Convert a string value from a select input to a number, or null if empty.
 * Use this when preparing form data for API submission.
 *
 * @example
 * ```ts
 * const voice_id = toNumberOrNull(form.voice_id) // '5' → 5, '' → null
 * ```
 */
export function toNumberOrNull(value: string | null | undefined): number | null {
  if (!value || !value.trim()) return null
  const num = Number(value)
  return isNaN(num) ? null : num
}

/**
 * Convert a number or null to a string for use in select inputs.
 * Use this when initializing form state from API data.
 *
 * @example
 * ```ts
 * const voice_id = toStringOrEmpty(data.story.voice_id) // 5 → '5', null → ''
 * ```
 */
export function toStringOrEmpty(value: number | null | undefined): string {
  return value != null ? String(value) : ''
}
