import { PUBLIC_API_URL } from '$env/static/public'
import type { CreateClientConfig } from './generated/client.gen'

// Babbel's filter[field][operator] contract is one level deeper than Hey API's
// bundled serializer supports, so serialize nested filter objects recursively.
function appendQueryValue(params: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return
  if (Array.isArray(value)) {
    for (const item of value) appendQueryValue(params, key, item)
    return
  }
  if (typeof value === 'object') {
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      appendQueryValue(params, `${key}[${nestedKey}]`, nestedValue)
    }
    return
  }
  params.append(key, String(value))
}

function querySerializer(query: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(params, key, value)
  }
  return params.toString()
}

export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  baseUrl: PUBLIC_API_URL,
  credentials: 'include',
  querySerializer,
})
