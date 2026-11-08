<script lang="ts">
  import { ExternalLink } from '#lib/components/icons.js'
  import { externalHref, isFromWordPress } from '#lib/utils/story-origin.js'
  import type { Story } from '#lib/types/index.js'

  let { story }: { story: Story } = $props()

  const href = $derived(isFromWordPress(story) ? externalHref(story) : undefined)
</script>

{#if href}
  <a
    {href}
    target="_blank"
    rel="noopener noreferrer"
    class="btn btn-outline"
  >
    <ExternalLink
      aria-hidden="true"
      class="h-5 w-5"
    />
    Open in WordPress
  </a>
{/if}
