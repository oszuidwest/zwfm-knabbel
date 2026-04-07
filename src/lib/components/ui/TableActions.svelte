<script lang="ts">
  import { Pencil, Trash2 } from '$lib/components/icons'

  interface Props {
    editHref: string
    onDelete: () => void
  }

  let { editHref, onDelete }: Props = $props()
</script>

<div class="flex gap-1">
  <a
    href={editHref}
    class="btn btn-ghost btn-sm"
    aria-label="Bewerken"
  >
    <Pencil
      aria-hidden="true"
      class="h-4 w-4"
    />
  </a>
  <button
    class="btn text-error btn-ghost btn-sm"
    onclick={onDelete}
    aria-label="Verwijderen"
  >
    <Trash2
      aria-hidden="true"
      class="h-4 w-4"
    />
  </button>
</div>
