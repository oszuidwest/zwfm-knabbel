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

<div class="form-control">
  <label
    class="label"
    for={id}
  >
    <span class="label-text">{label}</span>
  </label>
  {@render children()}
  {#if error}
    <label
      class="label"
      for={id}
    >
      <span class="label-text-alt text-error">{error}</span>
    </label>
  {:else if hint}
    <label
      class="label"
      for={id}
    >
      <span class="label-text-alt">{hint}</span>
    </label>
  {/if}
</div>
