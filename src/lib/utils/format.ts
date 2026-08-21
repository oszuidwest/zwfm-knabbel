/**
 * toLocalDateString returns a local YYYY-MM-DD date for API filters and form defaults.
 * It avoids toISOString(), which converts the date to UTC before formatting.
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** formatDate renders an API date string for Dutch UI copy. */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('nl-NL')
}

/** formatDateTime renders an API date-time string for Dutch UI copy. */
export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('nl-NL')
}

/** formatDuration renders seconds as an mm:ss duration label. */
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** formatRelativeTime renders a timestamp as Dutch relative copy ("3 uur geleden"). */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '-'
  const rtf = new Intl.RelativeTimeFormat('nl-NL', { numeric: 'auto' })
  const minutes = Math.round((new Date(dateString).getTime() - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  return rtf.format(Math.round(hours / 24), 'day')
}

/** formatFileSize renders byte counts with binary KB/MB units for compact UI labels. */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
