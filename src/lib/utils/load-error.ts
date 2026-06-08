import { error, redirect } from '@sveltejs/kit'
import { ApiError } from '$lib/api/client'
import { resolveInternalHref } from '$lib/utils/routes'

interface ResourceLoadErrorOptions {
  notFound: string
  failed?: string
}

export function throwResourceLoadError(
  err: unknown,
  { notFound, failed = 'Laden mislukt' }: ResourceLoadErrorOptions
): never {
  if (!(err instanceof ApiError)) {
    throw err
  }

  if (err.status === 401) {
    redirect(303, resolveInternalHref('/login'))
  }

  if (err.status === 403) {
    redirect(303, resolveInternalHref('/stories?denied=1'))
  }

  if (err.status === 404) {
    error(404, notFound)
  }

  if (err.status === 0) {
    error(503, 'Kan geen verbinding maken met de server')
  }

  if (err.status >= 500) {
    error(err.status, 'Serverfout bij laden')
  }

  error(err.status, err.message || failed)
}
