<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    id: string
    label: string
    error?: string
    hint?: string
    children: Snippet
  }

  let { id, label, error, hint, children }: Props = $props()
</script>

<fieldset class="fieldset">
  <label
    class="fieldset-legend"
    for={id}
  >
    {label}
  </label>
  {@render children()}
  {#if error}
    <p class="label max-w-full whitespace-normal text-error">{error}</p>
  {:else if hint}
    <p class="label max-w-full whitespace-normal">{hint}</p>
  {/if}
</fieldset>
