<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    when: boolean
    tip: string
    placement?: 'tooltip-top' | 'tooltip-bottom' | 'tooltip-left' | 'tooltip-right'
    wrapperClass?: string
    children: Snippet
  }

  let { when, tip, placement = 'tooltip-left', wrapperClass, children }: Props = $props()
</script>

{#if when}
  <div
    class={['tooltip', placement, wrapperClass]}
    data-tip={tip}
  >
    {@render children()}
  </div>
{:else if wrapperClass}
  <div class={wrapperClass}>
    {@render children()}
  </div>
{:else}
  {@render children()}
{/if}
