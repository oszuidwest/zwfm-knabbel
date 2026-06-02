<script lang="ts">
  import type { Snippet } from 'svelte'
  import { X } from '$lib/components/icons'

  interface Props {
    open: boolean
    hasActiveFilters?: boolean
    onClear?: () => void
    children: Snippet
  }

  let { open = $bindable(), hasActiveFilters = false, onClear, children }: Props = $props()
  let dialog: HTMLDialogElement

  function close(): void {
    open = false
  }

  function handleClose(): void {
    open = false
  }

  $effect(() => {
    if (!dialog || open === dialog.open) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  })
</script>

<dialog
  bind:this={dialog}
  class="modal modal-bottom sm:modal-middle"
  onclose={handleClose}
  aria-labelledby="filter-modal-title"
>
  <div class="modal-box">
    <div class="mb-4 flex items-center justify-between">
      <h3
        id="filter-modal-title"
        class="text-lg font-bold"
      >
        Filters
      </h3>
      <button
        class="btn btn-square btn-ghost btn-sm"
        onclick={close}
        aria-label="Sluiten"
      >
        <X
          aria-hidden="true"
          class="h-4 w-4"
        />
      </button>
    </div>

    <div class="space-y-4">
      {@render children()}
    </div>

    <div class="modal-action">
      {#if hasActiveFilters && onClear}
        <button
          class="btn btn-ghost"
          onclick={onClear}
        >
          Filters wissen
        </button>
      {/if}
      <button
        class="btn btn-primary"
        onclick={close}
      >
        Sluiten
      </button>
    </div>
  </div>
  <form
    method="dialog"
    class="modal-backdrop"
  >
    <button
      onclick={close}
      aria-label="Sluiten"
    >
      Sluiten
    </button>
  </form>
</dialog>
