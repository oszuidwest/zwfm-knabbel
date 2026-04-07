<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { formatDateTime, formatDuration } from '$lib/utils/format'
  import { Eye, Plus, Podcast } from '$lib/components/icons'
  import { PageHeader, EmptyState, Pagination } from '$lib/components/ui'

  let { data } = $props()

  // Get selected station from URL (single source of truth)
  const selectedStation = $derived($page.url.searchParams.get('station') ?? '')

  // Update station filter via URL
  function updateStationFilter(stationId: string): void {
    const url = new URL($page.url)
    // Reset to page 1 when filter changes
    url.searchParams.delete('page')
    if (stationId) {
      url.searchParams.set('station', stationId)
    } else {
      url.searchParams.delete('station')
    }
    goto(url.toString(), { invalidateAll: true })
  }
</script>

<div class="space-y-4 pb-20 md:pb-0">
  <PageHeader
    title="Bulletins"
    subtitle="{data.pagination.totalItems} bulletins"
    actionHref="/bulletins/new"
    actionLabel="Genereren"
  />

  <!-- Controls -->
  <div class="flex flex-wrap gap-2">
    <select
      class="select-bordered select flex-1 select-sm sm:flex-none"
      value={selectedStation}
      onchange={e => updateStationFilter(e.currentTarget.value)}
      aria-label="Filter op zender"
    >
      <option value="">Alle zenders</option>
      {#each data.stations as station (station.id)}
        <option value={String(station.id)}>{station.name}</option>
      {/each}
    </select>
  </div>

  {#if data.bulletins.length === 0}
    <EmptyState
      icon={Podcast}
      title="Geen bulletins"
      description="Genereer je eerste nieuwsbulletin."
      action={{ href: '/bulletins/new', label: 'Genereren' }}
    />
  {:else}
    <!-- Mobile: Cards view -->
    <div class="space-y-2 md:hidden">
      {#each data.bulletins as bulletin (bulletin.id)}
        <div
          role="button"
          tabindex="0"
          class="card cursor-pointer bg-base-100 transition-shadow hover:shadow-md active:bg-base-200"
          onclick={() => goto(`/bulletins/${bulletin.id}`)}
          onkeydown={e => e.key === 'Enter' && goto(`/bulletins/${bulletin.id}`)}
        >
          <div class="card-body p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                >
                  <Podcast
                    aria-hidden="true"
                    class="h-5 w-5"
                  />
                </div>
                <div class="min-w-0">
                  <h3 class="truncate font-medium">{bulletin.station_name}</h3>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-base-content/60">
                    <span>{formatDateTime(bulletin.created_at)}</span>
                    <span>•</span>
                    <span>{formatDuration(bulletin.duration_seconds)}</span>
                    <span>•</span>
                    <span>{bulletin.story_count ?? 0} berichten</span>
                    {#if bulletin.voice_name}
                      <span>•</span>
                      <span>{bulletin.voice_name}</span>
                    {/if}
                  </div>
                </div>
              </div>
              <span
                class="btn btn-square shrink-0 btn-ghost btn-sm"
                aria-hidden="true"
              >
                <Eye class="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Desktop: Table view -->
    <div class="card hidden bg-base-100 md:block">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Zender</th>
              <th>Aangemaakt</th>
              <th>Duur</th>
              <th>Berichten</th>
              <th>Nieuwslezer</th>
              <th class="w-24">Acties</th>
            </tr>
          </thead>
          <tbody>
            {#each data.bulletins as bulletin (bulletin.id)}
              <tr>
                <td class="font-medium">{bulletin.station_name}</td>
                <td>{formatDateTime(bulletin.created_at)}</td>
                <td>{formatDuration(bulletin.duration_seconds)}</td>
                <td>{bulletin.story_count ?? 0}</td>
                <td>{bulletin.voice_name ?? '-'}</td>
                <td>
                  <a
                    href="/bulletins/{bulletin.id}"
                    class="btn btn-ghost btn-sm"
                    aria-label="Details"
                  >
                    <Eye
                      aria-hidden="true"
                      class="h-4 w-4"
                    />
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <Pagination pagination={data.pagination} />
  {/if}
</div>

<!-- FAB: Generate bulletin link (mobile only) -->
<a
  href="/bulletins/new"
  class="btn fixed right-6 bottom-6 z-40 btn-circle shadow-lg btn-lg btn-primary md:hidden"
  aria-label="Genereer bulletin"
>
  <Plus
    aria-hidden="true"
    class="h-6 w-6"
  />
</a>
