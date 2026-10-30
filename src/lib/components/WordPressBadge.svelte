<script lang="ts">
  import { ExternalLink } from '#lib/components/icons.js'
  import { externalHref, isFromWordPress } from '#lib/utils/story-origin.js'
  import type { Story } from '#lib/types/index.js'

  let { story }: { story: Story } = $props()

  const href = $derived(externalHref(story))
</script>

{#if isFromWordPress(story)}
  {#if href}
    <a
      {href}
      target="_blank"
      rel="noopener noreferrer"
      class="badge shrink-0 badge-soft badge-sm hover:underline"
      aria-label="Open in WordPress"
    >
      WordPress
      <ExternalLink
        aria-hidden="true"
        class="h-3 w-3"
      />
    </a>
  {:else}
    <span class="badge shrink-0 badge-soft badge-sm">WordPress</span>
  {/if}
{/if}
