<script lang="ts">
  import { refreshAll } from '$app/navigation'
  import { deleteVoicesId } from '#lib/api/generated/sdk.gen.js'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { deleteWithConfirm } from '#lib/utils/crud.js'
  import { AudioLines, Mic } from '#lib/components/icons.js'
  import { ListPage, TableActions } from '#lib/components/ui/index.js'
  import type { Voice } from '#lib/types/index.js'

  let { data } = $props()
  const auth = getAuthContext()

  const canWrite = $derived(auth.can('voices', 'write'))

  function handleDelete(voice: Voice): void {
    deleteWithConfirm({
      name: voice.name ?? 'deze stem',
      deleteFn: () => deleteVoicesId({ path: { id: voice.id } }),
      onSuccess: () => refreshAll(),
      successMessage: 'Stem verwijderd',
    })
  }
</script>

{#snippet aiBadge(voice: Voice)}
  {#if voice.elevenlabs_voice_id}
    <span
      class="shrink-0 text-base-content/60"
      title="AI-stem"
    >
      <AudioLines
        aria-hidden="true"
        class="h-4 w-4"
      />
      <span class="sr-only">AI-stem</span>
    </span>
  {/if}
{/snippet}

<ListPage
  title="Stemmen"
  subtitle="{data.pagination.totalItems} stemmen"
  items={data.voices}
  icon={Mic}
  newHref="/voices/new"
  newLabel="Nieuwe stem"
  editHref={voice => `/voices/${voice.id}/edit`}
  emptyTitle="Geen stemmen"
  emptyDescription={canWrite
    ? 'Voeg je eerste stem toe om te beginnen.'
    : 'Nog geen stemmen aanwezig.'}
  pagination={data.pagination}
  onDelete={handleDelete}
  canCreate={canWrite}
  canEdit={canWrite}
  canDelete={canWrite}
>
  {#snippet cardContent(voice)}
    <h3 class="flex min-w-0 items-center gap-1.5 font-medium">
      <span class="truncate">{voice.name}</span>
      {@render aiBadge(voice)}
    </h3>
  {/snippet}

  {#snippet tableHeader()}
    <th>Naam</th>
    <th class="w-24">Acties</th>
  {/snippet}

  {#snippet tableRow(voice)}
    <td class="font-medium">
      <span class="flex items-center gap-1.5">
        {voice.name}
        {@render aiBadge(voice)}
      </span>
    </td>
    <td>
      <TableActions
        editHref="/voices/{voice.id}/edit"
        onDelete={() => handleDelete(voice)}
        canEdit={canWrite}
        canDelete={canWrite}
      />
    </td>
  {/snippet}
</ListPage>
