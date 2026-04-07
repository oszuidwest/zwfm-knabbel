<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { voicesApi } from '$lib/api/voices'
  import { deleteWithConfirm } from '$lib/utils/crud'
  import { Mic } from '$lib/components/icons'
  import { ListPage, TableActions } from '$lib/components/ui'
  import type { Voice } from '$lib/types'

  let { data } = $props()

  function handleDelete(voice: Voice): void {
    deleteWithConfirm({
      name: voice.name ?? 'deze stem',
      deleteFn: () => voicesApi.delete(voice.id!),
      onSuccess: () => invalidateAll(),
      successMessage: 'Stem verwijderd',
    })
  }
</script>

<ListPage
  title="Stemmen"
  subtitle="{data.pagination.totalItems} stemmen"
  items={data.voices}
  icon={Mic}
  newHref="/voices/new"
  newLabel="Nieuwe stem"
  editHref={voice => `/voices/${voice.id}/edit`}
  emptyTitle="Geen stemmen"
  emptyDescription="Voeg je eerste stem toe om te beginnen."
  pagination={data.pagination}
  onDelete={handleDelete}
>
  {#snippet cardContent(voice)}
    <h3 class="font-medium">{voice.name}</h3>
  {/snippet}

  {#snippet tableHeader()}
    <th>Naam</th>
    <th class="w-24">Acties</th>
  {/snippet}

  {#snippet tableRow(voice)}
    <td class="font-medium">{voice.name}</td>
    <td>
      <TableActions
        editHref="/voices/{voice.id}/edit"
        onDelete={() => handleDelete(voice)}
      />
    </td>
  {/snippet}
</ListPage>
