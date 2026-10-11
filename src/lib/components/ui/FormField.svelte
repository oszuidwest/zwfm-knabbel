<script
  lang="ts"
  module
>
  /** fieldA11y links a control to the error and hint FormField renders below it. */
  export function fieldA11y(id: string, error?: string, hint?: string) {
    return {
      'aria-invalid': error ? true : undefined,
      'aria-describedby':
        [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined,
    }
  }
</script>

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
    <p
      id="{id}-error"
      class="fieldset-label text-sm leading-relaxed text-error"
    >
      {error}
    </p>
  {/if}
  {#if hint}
    <p
      id="{id}-hint"
      class="fieldset-label text-sm leading-relaxed text-base-content/70"
    >
      {hint}
    </p>
  {/if}
</fieldset>
