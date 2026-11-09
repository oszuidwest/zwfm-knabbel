<script lang="ts">
  import type { Component } from 'svelte'
  import { X, Check } from '#lib/components/icons.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import MaybeTooltip from './MaybeTooltip.svelte'

  interface Props {
    cancelHref: string
    submitting: boolean
    submitLabel?: string
    submitIcon?: Component
    canSubmit?: boolean
    forbidTooltip?: string
  }

  let {
    cancelHref,
    submitting,
    submitLabel = 'Opslaan',
    submitIcon: SubmitIcon = Check,
    canSubmit = true,
    forbidTooltip = 'Geen rechten',
  }: Props = $props()
</script>

<div class="flex flex-wrap justify-end gap-2 pt-4">
  <a
    href={resolveInternalHref(cancelHref)}
    class="btn btn-ghost"
  >
    <X class="h-5 w-5" />
    Annuleren
  </a>
  <MaybeTooltip
    when={!canSubmit}
    tip={forbidTooltip}
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
