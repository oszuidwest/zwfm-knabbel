<script
  lang="ts"
  module
>
  /** fieldA11y links a control to the error or hint FormField renders below it. */
  export function fieldA11y(id: string, error?: string, hint?: string) {
    return {
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error || hint ? `${id}-msg` : undefined,
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
  {#if error || hint}
    <p
      id="{id}-msg"
      class={[
        'fieldset-label text-sm leading-relaxed',
        error ? 'text-error' : 'text-base-content/70',
      ]}
    >
      {error || hint}
    </p>
  {/if}
</fieldset>
