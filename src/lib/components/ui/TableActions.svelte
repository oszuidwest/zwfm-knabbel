<script lang="ts">
  import { Pencil, Trash2, Eye } from '#lib/components/icons.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import MaybeTooltip from './MaybeTooltip.svelte'

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

  const EditIcon = $derived(canEdit ? Pencil : Eye)

  function handleDelete(): void {
    if (!canDelete) return
    onDelete()
  }
</script>

<div class="flex gap-1">
  <a
    href={resolveInternalHref(editHref)}
    class="btn btn-ghost btn-sm"
    aria-label={canEdit ? 'Bewerken' : 'Bekijken'}
  >
    <EditIcon
      aria-hidden="true"
      class="h-4 w-4"
    />
  </a>
  <MaybeTooltip
    when={!canDelete}
    tip={forbidTooltip}
  >
    <button
      class={['btn btn-ghost btn-sm', canDelete && 'hover:text-error']}
      onclick={handleDelete}
      disabled={!canDelete}
      aria-label="Verwijderen"
    >
      <Trash2
        aria-hidden="true"
        class="h-4 w-4"
      />
    </button>
  </MaybeTooltip>
</div>
