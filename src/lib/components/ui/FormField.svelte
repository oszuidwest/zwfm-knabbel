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
    class="fieldset-legend text-base font-medium"
    for={id}
  >
    {label}
  </label>
  {@render children()}
  {#if error}
    <p class="fieldset-label text-sm leading-relaxed text-error">{error}</p>
  {:else if hint}
    <p class="fieldset-label text-sm leading-relaxed text-base-content/70">
      {hint}
    </p>
  {/if}
</fieldset>
