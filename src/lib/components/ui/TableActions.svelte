<script lang="ts">
  import { Pencil, Trash2, Eye } from '$lib/components/icons'
  import { resolveInternalHref } from '$lib/utils/routes'

  interface Props {
    editHref: string
    onDelete: () => void
    canEdit?: boolean
    canDelete?: boolean
    forbidTooltip?: string
  }

  let {
    editHref,
    onDelete,
    canEdit = true,
    canDelete = true,
    forbidTooltip = 'Geen rechten',
  }: Props = $props()

  const resolvedEditHref = $derived(resolveInternalHref(editHref))

  function handleDelete(): void {
    if (!canDelete) return
    onDelete()
  }
</script>

<div class="flex gap-1">
  <a
    href={resolvedEditHref}
    class="btn btn-ghost btn-sm"
    aria-label={canEdit ? 'Bewerken' : 'Bekijken'}
  >
    {#if canEdit}
      <Pencil
        aria-hidden="true"
        class="h-4 w-4"
      />
    {:else}
      <Eye
        aria-hidden="true"
        class="h-4 w-4"
      />
    {/if}
  </a>
  <div
    class="tooltip tooltip-left"
    data-tip={canDelete ? undefined : forbidTooltip}
  >
    <button
      class={['btn btn-ghost btn-sm', canDelete && 'text-error']}
      onclick={handleDelete}
      disabled={!canDelete}
      aria-label="Verwijderen"
    >
      <Trash2
        aria-hidden="true"
        class="h-4 w-4"
      />
    </button>
  </div>
</div>
