<script lang="ts">
  import { X, Check } from '$lib/components/icons'

  interface Props {
    cancelHref: string
    submitting: boolean
    submitLabel?: string
    cancelLabel?: string
  }

  let {
    cancelHref,
    submitting,
    submitLabel = 'Opslaan',
    cancelLabel = 'Annuleren',
  }: Props = $props()
</script>

<div class="flex justify-end gap-2 pt-4">
  <a
    href={cancelHref}
    class="btn btn-ghost"
  >
    <X class="h-5 w-5" />
    {cancelLabel}
  </a>
  <button
    type="submit"
    class="btn btn-primary"
    disabled={submitting}
  >
    {#if submitting}
      <span class="loading loading-sm loading-spinner"></span>
    {:else}
      <Check class="h-5 w-5" />
    {/if}
    {submitLabel}
  </button>
</div>
