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

export function toNumberOrNull(value: string | null | undefined): number | null {
  if (!value || !value.trim()) return null
  const num = Number(value)
  return isNaN(num) ? null : num
}

export function toStringOrEmpty(value: number | null | undefined): string {
  return value != null ? String(value) : ''
}
