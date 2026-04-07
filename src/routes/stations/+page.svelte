<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { stationsApi } from '$lib/api/stations'
  import { deleteWithConfirm } from '$lib/utils/crud'
  import { Radio } from '$lib/components/icons'
  import { ListPage, TableActions } from '$lib/components/ui'
  import type { Station } from '$lib/types'

  let { data } = $props()

  function handleDelete(station: Station): void {
    deleteWithConfirm({
      name: station.name ?? 'deze zender',
      deleteFn: () => stationsApi.delete(station.id!),
      onSuccess: () => invalidateAll(),
      successMessage: 'Zender verwijderd',
    })
  }
</script>

<ListPage
  title="Zenders"
  subtitle="{data.pagination.totalItems} zenders"
  items={data.stations}
  icon={Radio}
  newHref="/stations/new"
  newLabel="Nieuwe zender"
  editHref={station => `/stations/${station.id}/edit`}
  emptyTitle="Geen zenders"
  emptyDescription="Maak je eerste zender aan om te beginnen."
  pagination={data.pagination}
  onDelete={handleDelete}
>
  {#snippet cardContent(station)}
    <h3 class="font-medium">{station.name}</h3>
    <div class="flex flex-wrap gap-2 text-sm text-base-content/60">
      <span>{station.max_stories_per_block} berichten</span>
      <span>•</span>
      <span>{station.pause_seconds}s pauze</span>
    </div>
  {/snippet}

  {#snippet tableHeader()}
    <th>Naam</th>
    <th>Max berichten</th>
    <th>Pauze</th>
    <th class="w-24">Acties</th>
  {/snippet}

  {#snippet tableRow(station)}
    <td class="font-medium">{station.name}</td>
    <td>{station.max_stories_per_block}</td>
    <td>{station.pause_seconds}s</td>
    <td>
      <TableActions
        editHref="/stations/{station.id}/edit"
        onDelete={() => handleDelete(station)}
      />
    </td>
  {/snippet}
</ListPage>
