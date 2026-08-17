import { PUBLIC_API_URL } from '$env/static/public'
import { client } from './generated/client.gen'
import { toast } from '$lib/stores/toast'

const REQUEST_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 120_000

export interface ProblemFieldError {
  field?: string
  message?: string
}

export interface ProblemDetails {
  code?: string
  type?: string
  title?: string
  status?: number
  detail?: string
  hint?: string
  errors?: ProblemFieldError[]
}

class ApiError extends Error {
  notified = false

  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isProblemFieldError(value: unknown): value is ProblemFieldError {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return isOptionalString(candidate.field) && isOptionalString(candidate.message)
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    isOptionalString(candidate.code) &&
    isOptionalString(candidate.type) &&
    isOptionalString(candidate.title) &&
    (candidate.status === undefined || typeof candidate.status === 'number') &&
    isOptionalString(candidate.detail) &&
    isOptionalString(candidate.hint) &&
    (candidate.errors === undefined ||
      (Array.isArray(candidate.errors) && candidate.errors.every(isProblemFieldError)))
  )
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'string' && error) return error
  if (typeof error !== 'object' || error === null) return fallbackMessage

  const candidate = error as Record<string, unknown>
  for (const key of ['detail', 'message', 'title', 'error']) {
    if (typeof candidate[key] === 'string' && candidate[key]) return candidate[key]
  }

  return fallbackMessage
}

function isUpload(request: Request | undefined): boolean {
  return request?.headers.get('content-type')?.startsWith('multipart/form-data') ?? false
}

// Timeouts live on the client so no SDK call site can forget them.
client.interceptors.request.use(
  request =>
    new Request(request, {
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(isUpload(request) ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS),
      ]),
    })
)

client.interceptors.error.use((error, response, request) => {
  if (error instanceof ApiError) return error

  if (!response) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return new ApiError(0, isUpload(request) ? 'Upload timeout' : 'Request timeout')
    }
    if (error instanceof TypeError) return new ApiError(0, 'Network error')
    return error
  }

  const apiError = new ApiError(response.status, getErrorMessage(error, 'Request failed'), error)
  if (response.status === 403 && request?.method !== 'GET') {
    toast.error('Geen rechten voor deze actie')
    apiError.notified = true
  }

  return apiError
})

export function getMediaUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // API media fields may be root-relative or already include /api/v1.
  const cleanPath = path.startsWith('/api/v1')
    ? path
    : `/api/v1${path.startsWith('/') ? '' : '/'}${path}`
  return `${PUBLIC_API_URL}${cleanPath}`
}

export function notifyMutationError(error: unknown, fallbackMessage: string): void {
  if (error instanceof ApiError && error.notified) return
  if (error instanceof ApiError) {
    const details = isProblemDetails(error.details) ? error.details : undefined
    toast.error(details?.detail ?? fallbackMessage)
    return
  }
  toast.error(fallbackMessage)
}

export { ApiError, isProblemDetails }
