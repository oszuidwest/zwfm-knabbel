import { PUBLIC_API_URL } from '$env/static/public'
import { toast } from '$lib/stores/toast'

const API_BASE = `${PUBLIC_API_URL}/api/v1`

type FetchFn = typeof fetch

interface PaginationFilters {
  limit?: number
  offset?: number
  [key: string]: string | number | boolean | undefined
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
  fetch?: FetchFn
}

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

async function parseErrorResponse(
  response: Response,
  fallbackMessage: string
): Promise<{ message: string; details?: unknown }> {
  try {
    const errorData = await response.json()
    // Support both standard error formats and RFC 7807 problem details
    const message =
      errorData.detail || errorData.message || errorData.title || errorData.error || fallbackMessage
    return { message, details: errorData }
  } catch {
    return { message: fallbackMessage }
  }
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return {} as T
  return JSON.parse(text) as T
}

function handleFetchError(err: unknown, timeoutMessage: string): never {
  if (err instanceof ApiError) throw err
  if (err instanceof Error && err.name === 'AbortError') {
    throw new ApiError(0, timeoutMessage)
  }
  if (err instanceof TypeError) {
    throw new ApiError(0, 'Network error')
  }
  throw err
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, fetch: customFetch, ...fetchOptions } = options
  const fetchFn = customFetch ?? fetch

  let url = `${API_BASE}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const requestBody = body !== undefined ? JSON.stringify(body) : undefined
  const headers = new Headers(fetchOptions.headers)
  if (requestBody !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  let response: Response
  try {
    response = await fetchFn(url, {
      ...fetchOptions,
      credentials: 'include',
      headers,
      body: requestBody,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    handleFetchError(err, 'Request timeout')
  }

  clearTimeout(timeoutId)

  if (!response.ok) {
    const { message, details } = await parseErrorResponse(response, 'Request failed')
    const err = new ApiError(response.status, message, details)
    if (response.status === 403 && (fetchOptions.method ?? 'GET') !== 'GET') {
      toast.error('Geen rechten voor deze actie')
      err.notified = true
    }
    throw err
  }

  return parseResponseBody<T>(response)
}

async function upload<T>(
  endpoint: string,
  file: File,
  fieldName = 'audio',
  customFetch?: FetchFn
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const fetchFn = customFetch ?? fetch

  const formData = new FormData()
  formData.append(fieldName, file)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout for uploads

  let response: Response
  try {
    response = await fetchFn(url, {
      method: 'POST',
      credentials: 'include',
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    handleFetchError(err, 'Upload timeout')
  }

  clearTimeout(timeoutId)

  if (!response.ok) {
    const { message, details } = await parseErrorResponse(response, 'Upload failed')
    const err = new ApiError(response.status, message, details)
    if (response.status === 403) {
      toast.error('Geen rechten voor deze actie')
      err.notified = true
    }
    throw err
  }

  return parseResponseBody<T>(response)
}

export function getMediaUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // Remove /api/v1 prefix if present, then prepend full API base
  const cleanPath = path.startsWith('/api/v1')
    ? path
    : `/api/v1${path.startsWith('/') ? '' : '/'}${path}`
  return `${PUBLIC_API_URL}${cleanPath}`
}

export const api = {
  get: <T>(endpoint: string, params?: RequestOptions['params'], customFetch?: FetchFn) =>
    request<T>(endpoint, { method: 'GET', params, fetch: customFetch }),

  post: <T>(endpoint: string, body?: unknown, customFetch?: FetchFn) =>
    request<T>(endpoint, { method: 'POST', body, fetch: customFetch }),

  put: <T>(endpoint: string, body?: unknown, customFetch?: FetchFn) =>
    request<T>(endpoint, { method: 'PUT', body, fetch: customFetch }),

  patch: <T>(endpoint: string, body?: unknown, customFetch?: FetchFn) =>
    request<T>(endpoint, { method: 'PATCH', body, fetch: customFetch }),

  delete: <T>(endpoint: string, customFetch?: FetchFn) =>
    request<T>(endpoint, { method: 'DELETE', fetch: customFetch }),

  upload,
}

export function notifyMutationError(err: unknown, fallbackMessage: string): void {
  if (err instanceof ApiError && err.notified) return
  toast.error(fallbackMessage)
}

export { ApiError, isProblemDetails }
export type { FetchFn, PaginationFilters }
