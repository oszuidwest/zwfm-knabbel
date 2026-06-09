import { resolve } from '$app/paths'

/**
 * resolveInternalHref resolves internal paths through `$app/paths.resolve` so base-path deploys
 * keep working. Pass-through for non-`/`-prefixed values (external URLs, `#`).
 *
 * Policy: resolve at the DOM/`goto` boundary. Shared UI components that render
 * `<a>` resolve their href props internally; route-level code resolves where
 * it directly renders `<a>` or calls `goto(...)`. No wrapper component.
 */
export function resolveInternalHref(href: string): string {
  if (!href.startsWith('/')) return href

  // @ts-expect-error SvelteKit types only accept generated route literals; this helper also handles dynamic internal paths.
  return resolve(href)
}
