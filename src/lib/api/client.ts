import { PUBLIC_API_URL } from '$app/env/public'
import { client } from './generated/client.gen'
import { toast } from '#lib/stores/toast.js'
import {
  UPLOAD_TIMEOUT_MESSAGE,
  describeProblem,
  fieldErrorsFromProblem,
  isProblemDetails,
} from './problems'

const REQUEST_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 120_000

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

// Empty messages let callers supply their Dutch fallback.
function getErrorMessage(error: unknown, status: number): string {
  if (typeof error === 'string' && error) return error
  if (isProblemDetails(error)) {
    const message = describeProblem(status, error)
    if (message) return message
  }

  if (typeof error !== 'object' || error === null) return ''

  const candidate = error as Record<string, unknown>

  for (const key of ['detail', 'message', 'title', 'error']) {
    if (typeof candidate[key] === 'string' && candidate[key]) return candidate[key]
  }

  return ''
}

function isUpload(request: Request | undefined): boolean {
  return request?.headers.get('content-type')?.startsWith('multipart/form-data') ?? false
}

let sessionExpiredHandler: (() => Promise<unknown>) | undefined
let sessionExpiring: Promise<unknown> | undefined

/** The root layout passes the move to the login page here. */
export function onSessionExpired(handler: () => Promise<unknown>): void {
  sessionExpiredHandler = handler
}

// Registered by the root layout import before any SDK calls.
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
    if (request?.signal.reason?.name === 'TimeoutError') {
      return new ApiError(
        0,
        isUpload(request) ? UPLOAD_TIMEOUT_MESSAGE : 'De server reageerde niet op tijd'
      )
    }
    if (error instanceof TypeError) return new ApiError(0, 'Geen verbinding met de server')
    return error
  }

  const apiError = new ApiError(response.status, getErrorMessage(error, response.status), error)
  // Loads redirect on 401 themselves. On /sessions a 401 is a failed login or logout.
  if (
    response.status === 401 &&
    request?.method !== 'GET' &&
    !request?.url.includes('/api/v1/sessions')
  ) {
    apiError.message = 'Je sessie is verlopen'
    apiError.notified = true
    sessionExpiring ??= sessionExpiredHandler?.()
      .catch((err: unknown) => console.error('[auth] moving to the login page failed', err))
      .finally(() => (sessionExpiring = undefined))
  }
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
  if (error instanceof ApiError) {
    if (!error.notified) toast.error(error.message || fallbackMessage)
    return
  }
  toast.error(fallbackMessage)
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !isProblemDetails(error.details)) return {}
  return fieldErrorsFromProblem(error.details)
}

export function getUploadFailure(error: unknown): string {
  return (
    getFieldErrors(error).audio || (error instanceof ApiError && error.message) || 'Upload mislukt'
  )
}

export { ApiError, isProblemDetails }
