<script lang="ts">
  import { X, Check } from '$lib/components/icons'
  import { resolveInternalHref } from '$lib/utils/routes'

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

  const resolvedCancelHref = $derived(resolveInternalHref(cancelHref))
</script>

<div class="flex justify-end gap-2 pt-4">
  <a
    href={resolvedCancelHref}
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
