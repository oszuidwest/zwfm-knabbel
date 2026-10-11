<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    when: boolean
    tip: string
    placement?: 'tooltip-top' | 'tooltip-bottom' | 'tooltip-left' | 'tooltip-right'
    wrapperClass?: string
    /** announce repeats the tip for screen readers; turn it off when the control can take focus. */
    announce?: boolean
    children: Snippet
  }

  let {
    when,
    tip,
    placement = 'tooltip-left',
    wrapperClass,
    announce = true,
    children,
  }: Props = $props()
</script>

{#if when}
  <div
    class={['tooltip', placement, wrapperClass]}
    data-tip={tip}
  >
    {@render children()}
    {#if announce}
      <!-- Expose the tooltip to screen readers when the control cannot take focus. -->
      <span class="sr-only">{tip}</span>
    {/if}
  </div>
{:else if wrapperClass}
  <div class={wrapperClass}>
    {@render children()}
  </div>
{:else}
  {@render children()}
{/if}
