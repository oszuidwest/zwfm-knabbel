import { resolve } from '$app/paths'

/**
 * Resolve at the DOM/goto boundary, exactly once, to support base-path deploys.
 * Shared link components resolve their own href props.
 */
export function resolveInternalHref(href: string): string {
  if (!href.startsWith('/')) return href

  // @ts-expect-error SvelteKit types only accept generated pathnames; this helper also handles dynamic internal paths.
  return resolve(href.slice(1))
}
