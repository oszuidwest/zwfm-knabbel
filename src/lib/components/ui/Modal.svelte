<script lang="ts">
  import type { Snippet } from 'svelte'
  import { X } from '$lib/components/icons'
  import { showModal } from '$lib/utils/dialog'

  interface Props {
    title: string
    onclose: () => void
    boxClass?: string
    children: Snippet
    /** actions renders the footer buttons. Put the primary one last so phones stack it on top. */
    actions: Snippet
  }

  let { title, onclose, boxClass, children, actions }: Props = $props()

  const titleId = $props.id()
</script>

<!-- The modal is open while mounted; every way to close it calls onclose, so the parent unmounts it. -->
<dialog
  class="modal modal-bottom sm:modal-middle"
  aria-labelledby={titleId}
  {onclose}
  {@attach showModal}
>
  <div class={['modal-box', boxClass]}>
    <div class="mb-4 flex items-start justify-between gap-2">
      <h2
        id={titleId}
        class="text-lg font-bold"
      >
        {title}
      </h2>
      <button
        type="button"
        class="btn btn-square btn-ghost btn-sm"
        onclick={onclose}
        aria-label="Sluiten"
      >
        <X
          aria-hidden="true"
          class="h-4 w-4"
        />
      </button>
    </div>

    {@render children()}

    <div class="modal-action flex-col-reverse sm:flex-row">
      {@render actions()}
    </div>
  </div>
  <form
    method="dialog"
    class="modal-backdrop"
  >
    <button
      tabindex="-1"
      aria-hidden="true"
    >
      Sluiten
    </button>
  </form>
</dialog>
