import { PUBLIC_API_URL } from '$env/static/public'
import { client } from './generated/client.gen'
import { toast } from '$lib/stores/toast'
import { describeProblem, fieldErrorsFromProblem, isProblemDetails } from './problems'

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

function getErrorMessage(error: unknown, status: number, fallbackMessage: string): string {
  if (typeof error === 'string' && error) return error
  if (isProblemDetails(error)) {
    const message = describeProblem(status, error)
    if (message) return message
  }
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
// Interceptor registration is a side effect of importing this module; the root
// +layout.ts imports it explicitly so it runs before any SDK call.
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
      return new ApiError(0, isUpload(request) ? 'Upload timeout' : 'Request timeout')
    }
    if (error instanceof TypeError) return new ApiError(0, 'Network error')
    return error
  }

  const apiError = new ApiError(
    response.status,
    getErrorMessage(error, response.status, 'Request failed'),
    error
  )
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
    // The error interceptor already extracted the ProblemDetails message.
    if (!error.notified) toast.error(error.message || fallbackMessage)
    return
  }
  toast.error(fallbackMessage)
}

/** getFieldErrors returns Dutch inline messages for the fields a 400 or 422 response rejected. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !isProblemDetails(error.details)) return {}
  return fieldErrorsFromProblem(error.details)
}

/** getUploadFailure explains a failed upload; timeouts and network errors get Dutch copy too. */
export function getUploadFailure(error: unknown): string {
  if (!(error instanceof ApiError)) return 'onbekende fout'
  if (error.status === 0) {
    return error.message === 'Upload timeout' ? 'upload duurde te lang' : 'geen verbinding'
  }
  return error.message
}

export { ApiError, isProblemDetails }
