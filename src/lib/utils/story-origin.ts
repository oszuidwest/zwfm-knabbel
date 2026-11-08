import type { Story } from '#lib/types/index.js'

// The plugin marks its stories with metadata.wordpress_id. external_id and
// external_url do not name the sender, and older stories lack them.
export function isFromWordPress(story: Pick<Story, 'metadata'>): boolean {
  return !!story.metadata?.wordpress_id
}

// Only an http(s) external_url becomes a link.
export function externalHref(story: Pick<Story, 'external_url'>): string | undefined {
  try {
    const { href, protocol } = new URL(story.external_url ?? '')
    return protocol === 'https:' || protocol === 'http:' ? href : undefined
  } catch {
    return undefined
  }
}
