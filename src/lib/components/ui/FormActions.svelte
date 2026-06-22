<script lang="ts">
  import type { Component } from 'svelte'
  import { X, Check } from '$lib/components/icons'
  import { resolveInternalHref } from '$lib/utils/routes'
  import MaybeTooltip from './MaybeTooltip.svelte'

  interface Props {
    cancelHref: string
    submitting: boolean
    submitLabel?: string
    cancelLabel?: string
    submitIcon?: Component
    canSubmit?: boolean
    forbidTooltip?: string
  }

  let {
    cancelHref,
    submitting,
    submitLabel = 'Opslaan',
    cancelLabel = 'Annuleren',
    submitIcon: SubmitIcon = Check,
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
  <MaybeTooltip
    when={!canSubmit}
    tip={forbidTooltip}
    placement="tooltip-left"
  >
    <button
      type="submit"
      class="btn btn-primary"
      disabled={submitting || !canSubmit}
    >
      {#if submitting}
        <span class="loading loading-sm loading-spinner"></span>
      {:else}
        <SubmitIcon
          aria-hidden="true"
          class="h-5 w-5"
        />
      {/if}
      {submitLabel}
    </button>
  </MaybeTooltip>
</div>
