<script lang="ts">
  import type { Snippet } from 'svelte'
  import Modal from './Modal.svelte'

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
  <Modal
    title="Filters"
    onclose={close}
  >
    <div class="space-y-4">
      {@render children()}
    </div>

    {#snippet actions()}
      {#if hasActiveFilters && onClear}
        <button
          type="button"
          class="btn btn-ghost"
          onclick={onClear}
        >
          Filters wissen
        </button>
      {/if}
      <button
        type="button"
        class="btn btn-primary"
        onclick={close}
      >
        Sluiten
      </button>
    {/snippet}
  </Modal>
{/if}
