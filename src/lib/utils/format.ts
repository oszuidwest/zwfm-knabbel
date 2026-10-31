/** Local YYYY-MM-DD; toISOString() can shift the calendar day through UTC. */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Treat date-only strings as local midnight, not UTC. */
export function parseDate(dateString: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateString) ? `${dateString}T00:00` : dateString)
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return parseDate(dateString).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('nl-NL')
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null) return '-'
  const rounded = Math.round(seconds)
  const mins = Math.floor(rounded / 60)
  const secs = rounded % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '-'
  const minutes = Math.round((new Date(dateString).getTime() - Date.now()) / 60_000)
  // Dutch `numeric: 'auto'` renders 0 minutes as "binnen een minuut", also for the past.
  if (minutes === 0) return 'zojuist'
  const rtf = new Intl.RelativeTimeFormat('nl-NL', { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  return rtf.format(Math.round(hours / 24), 'day')
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
