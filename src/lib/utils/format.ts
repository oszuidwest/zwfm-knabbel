/**
 * Get local date as YYYY-MM-DD string (for API calls, form defaults)
 * Avoids timezone issues with toISOString() which converts to UTC
 */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a date string to Dutch locale date (for display)
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('nl-NL')
}

/**
 * Format a date string to Dutch locale date and time
 */
export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('nl-NL')
}

/**
 * Format seconds to mm:ss duration
 */
export function formatDuration(seconds: number | undefined | null): string {
  if (seconds == null) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
