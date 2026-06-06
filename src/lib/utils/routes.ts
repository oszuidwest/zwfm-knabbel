import { resolve } from '$app/paths'

export function resolveInternalHref(href: string): string {
  if (!href.startsWith('/')) return href

  // @ts-expect-error SvelteKit types only accept generated route literals; this helper also handles dynamic internal paths.
  return resolve(href)
}
