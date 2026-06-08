<script lang="ts">
  import { X, Check } from '$lib/components/icons'
  import { resolveInternalHref } from '$lib/utils/routes'

  interface Props {
    cancelHref: string
    submitting: boolean
    submitLabel?: string
    cancelLabel?: string
    canSubmit?: boolean
    forbidTooltip?: string
  }

  let {
    cancelHref,
    submitting,
    submitLabel = 'Opslaan',
    cancelLabel = 'Annuleren',
    canSubmit = true,
    forbidTooltip = 'Geen rechten',
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
  <div
    class="tooltip tooltip-left"
    data-tip={canSubmit ? undefined : forbidTooltip}
  >
    <button
      type="submit"
      class="btn btn-primary"
      disabled={submitting || !canSubmit}
    >
      {#if submitting}
        <span class="loading loading-sm loading-spinner"></span>
      {:else}
        <Check class="h-5 w-5" />
      {/if}
      {submitLabel}
    </button>
  </div>
</div>
