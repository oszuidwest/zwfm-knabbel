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

  function close(): void {
    open = false
  }
</script>

{#if open}
  <div class="modal-open modal modal-bottom sm:modal-middle">
    <div class="modal-box">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold">Filters</h3>
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
    <button
      class="modal-backdrop"
      onclick={close}
      aria-label="Sluiten"
    ></button>
  </div>
{/if}
