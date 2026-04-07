<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/stores'
  import { storiesApi } from '$lib/api/stories'
  import { deleteWithConfirm } from '$lib/utils/crud'
  import { formatDate } from '$lib/utils/format'
  import { statusLabels, statusColors, statusOptions } from '$lib/utils/labels'
  import {
    FileText,
    Play,
    Plus,
    Search,
    CassetteTape,
    SlidersHorizontal,
    Zap,
  } from '$lib/components/icons'
  import { PageHeader, EmptyState, TableActions, FilterModal, Pagination } from '$lib/components/ui'
  import ReadMode from '$lib/components/ReadMode.svelte'
  import type { Story } from '$lib/types'

  let { data } = $props()
  let showFilterModal = $state(false)
  let readModeStory = $state<Story | null>(null)

  // Filter state from URL parameters
  const statusFilter = $derived($page.url.searchParams.get('status') ?? '')
  const dateFilter = $derived($page.url.searchParams.get('date') ?? '')
  const audioFilter = $derived($page.url.searchParams.get('audio') ?? '')
  const searchQuery = $derived($page.url.searchParams.get('q') ?? '')

  // Count hidden filters for mobile badge
  const hiddenFilterCount = $derived((statusFilter ? 1 : 0) + (searchQuery ? 1 : 0))

  // Check if any filter is active
  const hasActiveFilters = $derived(!!(statusFilter || dateFilter || audioFilter || searchQuery))

  // Update URL and trigger server-side reload
  function updateFilters(updates: Record<string, string>): void {
    const url = new URL($page.url)
    // Reset to page 1 when filters change
    url.searchParams.delete('page')
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    }
    goto(url.toString(), { invalidateAll: true })
  }

  const handleDelete = (story: Story) =>
    deleteWithConfirm({
      name: story.title ?? 'dit bericht',
      deleteFn: () => storiesApi.delete(story.id!),
      onSuccess: () => invalidateAll(),
      successMessage: 'Bericht verwijderd',
    })

  function formatDateLabel(type: 'today' | 'tomorrow'): string {
    const date = new Date()
    if (type === 'tomorrow') {
      date.setDate(date.getDate() + 1)
    }
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatCompactDateRange(startDate?: string, endDate?: string): string {
    const formatCompact = (dateStr?: string) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    }
    const start = formatCompact(startDate)
    const end = formatCompact(endDate)
    if (start && end) return `${start} - ${end}`
    if (start) return `Vanaf ${start}`
    if (end) return `Tot ${end}`
    return ''
  }

  function clearHiddenFilters(): void {
    updateFilters({ status: '', q: '' })
  }
</script>

<div class="space-y-4 pb-20 md:pb-0">
  <PageHeader
    title="Berichten"
    subtitle="{data.pagination.totalItems} berichten"
    actionHref="/stories/new"
    actionLabel="Nieuw bericht"
  />

  <!-- Date tabs + Audio filter -->
  <div class="flex flex-wrap items-center gap-2">
    <div class="tabs-boxed tabs">
      <button
        class="tab-sm md:tab-md tab {dateFilter === '' ? 'tab-active' : ''}"
        onclick={() => updateFilters({ date: '', status: '' })}
      >
        Alle
      </button>
      <button
        class="tab-sm md:tab-md tab {dateFilter === 'today' ? 'tab-active' : ''}"
        onclick={() => updateFilters({ date: 'today' })}
      >
        Vandaag
        <span class="ml-1 hidden text-xs opacity-60 sm:inline">({formatDateLabel('today')})</span>
      </button>
      <button
        class="tab-sm md:tab-md tab {dateFilter === 'tomorrow' ? 'tab-active' : ''}"
        onclick={() => updateFilters({ date: 'tomorrow' })}
      >
        Morgen
        <span class="ml-1 hidden text-xs opacity-60 sm:inline">({formatDateLabel('tomorrow')})</span
        >
      </button>
    </div>

    <select
      class="select-bordered select select-sm"
      value={audioFilter}
      onchange={e => updateFilters({ audio: e.currentTarget.value })}
      aria-label="Filter op audio"
    >
      <option value="">Audio: alle</option>
      <option value="without">Zonder audio</option>
      <option value="with">Met audio</option>
    </select>

    <!-- More filters button (mobile) -->
    <button
      class="btn btn-outline btn-sm md:hidden"
      onclick={() => (showFilterModal = true)}
      aria-label="Meer filters"
    >
      <SlidersHorizontal
        aria-hidden="true"
        class="h-4 w-4"
      />
      {#if hiddenFilterCount > 0}
        <span class="badge badge-sm badge-primary">{hiddenFilterCount}</span>
      {/if}
    </button>

    <!-- Desktop filters -->
    <div class="hidden items-center gap-2 md:flex">
      <select
        class="select-bordered select select-sm"
        value={statusFilter}
        onchange={e => updateFilters({ status: e.currentTarget.value })}
        aria-label="Filter op status"
      >
        <option value="">Alle statussen</option>
        {#each statusOptions as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>

      <div class="relative">
        <Search
          aria-hidden="true"
          class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-base-content/40"
        />
        <input
          type="search"
          placeholder="Zoeken..."
          class="input-bordered input input-sm pl-9"
          value={searchQuery}
          onchange={e => updateFilters({ q: e.currentTarget.value })}
          aria-label="Zoeken in berichten"
        />
      </div>
    </div>
  </div>

  {#if data.stories.length === 0}
    <EmptyState
      icon={FileText}
      title="Geen berichten"
      description={hasActiveFilters
        ? 'Geen berichten gevonden met deze filters.'
        : 'Maak je eerste bericht aan om te beginnen.'}
      action={!hasActiveFilters ? { href: '/stories/new', label: 'Nieuw bericht' } : undefined}
    />
  {:else}
    <!-- Mobile: Cards view -->
    <div class="space-y-2 md:hidden">
      {#each data.stories as story (story.id)}
        <a
          href="/stories/{story.id}/edit"
          class="card bg-base-100 transition-shadow hover:shadow-md active:bg-base-200"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="truncate font-medium">{story.title}</h3>
                  {#if story.is_breaking}
                    <span
                      class="text-primary"
                      title="Breaking nieuws"
                    >
                      <Zap
                        aria-hidden="true"
                        class="h-4 w-4 fill-current"
                      />
                    </span>
                  {/if}
                  {#if story.audio_file}
                    <span
                      class="text-success"
                      title="Audio aanwezig"
                    >
                      <Play
                        aria-hidden="true"
                        class="h-4 w-4"
                      />
                    </span>
                  {/if}
                </div>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-base-content/60">
                  <span class="badge badge-sm {statusColors[story.status ?? 'draft']}">
                    {statusLabels[story.status ?? 'draft']}
                  </span>
                  {#if story.start_date || story.end_date}
                    <span>{formatCompactDateRange(story.start_date, story.end_date)}</span>
                  {/if}
                </div>
              </div>
              <div
                class="tooltip tooltip-left"
                data-tip="Leesmodus"
              >
                <button
                  class="btn btn-square shrink-0 btn-ghost btn-sm"
                  onclick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    readModeStory = story
                  }}
                  aria-label="Open leesmodus voor {story.title}"
                >
                  <CassetteTape
                    aria-hidden="true"
                    class="h-5 w-5"
                  />
                </button>
              </div>
            </div>
          </div>
        </a>
      {/each}
    </div>

    <!-- Desktop: Table view -->
    <div class="card hidden bg-base-100 md:block">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Status</th>
              <th>Audio</th>
              <th>Start</th>
              <th>Einde</th>
              <th class="w-32">Acties</th>
            </tr>
          </thead>
          <tbody>
            {#each data.stories as story (story.id)}
              <tr>
                <td class="font-medium">
                  <span class="flex items-center gap-1.5">
                    {story.title}
                    {#if story.is_breaking}
                      <span
                        class="text-primary"
                        title="Breaking nieuws"
                      >
                        <Zap
                          aria-hidden="true"
                          class="h-4 w-4 fill-current"
                        />
                      </span>
                    {/if}
                  </span>
                </td>
                <td>
                  <span class="badge {statusColors[story.status ?? 'draft']}">
                    {statusLabels[story.status ?? 'draft']}
                  </span>
                </td>
                <td>
                  {#if story.audio_file}
                    <span
                      class="text-success"
                      title="Audio aanwezig"
                    >
                      <Play
                        aria-hidden="true"
                        class="h-4 w-4"
                      />
                    </span>
                  {:else}
                    <span class="text-base-content/30">-</span>
                  {/if}
                </td>
                <td>{formatDate(story.start_date)}</td>
                <td>{formatDate(story.end_date)}</td>
                <td>
                  <div class="flex gap-1">
                    <div
                      class="tooltip tooltip-left"
                      data-tip="Leesmodus"
                    >
                      <button
                        class="btn btn-square btn-ghost btn-sm"
                        onclick={() => (readModeStory = story)}
                        aria-label="Open leesmodus voor {story.title}"
                      >
                        <CassetteTape
                          aria-hidden="true"
                          class="h-4 w-4"
                        />
                      </button>
                    </div>
                    <TableActions
                      editHref="/stories/{story.id}/edit"
                      onDelete={() => handleDelete(story)}
                    />
                  </div>
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

<!-- FAB: New story button (mobile only) -->
<a
  href="/stories/new"
  class="btn fixed right-6 bottom-6 z-40 btn-circle shadow-lg btn-lg btn-primary md:hidden"
  aria-label="Nieuw bericht"
>
  <Plus
    aria-hidden="true"
    class="h-6 w-6"
  />
</a>

<!-- Filter modal (mobile) -->
<FilterModal
  bind:open={showFilterModal}
  hasActiveFilters={hiddenFilterCount > 0}
  onClear={clearHiddenFilters}
>
  <div class="form-control">
    <label
      class="label"
      for="modal-status"
    >
      <span class="label-text">Status</span>
    </label>
    <select
      id="modal-status"
      class="select-bordered select w-full"
      value={statusFilter}
      onchange={e => updateFilters({ status: e.currentTarget.value })}
    >
      <option value="">Alle statussen</option>
      {#each statusOptions as option (option.value)}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>

  <div class="form-control">
    <label
      class="label"
      for="modal-search"
    >
      <span class="label-text">Zoeken</span>
    </label>
    <input
      id="modal-search"
      type="search"
      placeholder="Zoek in titel of tekst..."
      class="input-bordered input w-full"
      value={searchQuery}
      onchange={e => updateFilters({ q: e.currentTarget.value })}
    />
  </div>
</FilterModal>

<!-- Leesmodus overlay -->
{#if readModeStory}
  <ReadMode
    text={readModeStory.text}
    onclose={() => (readModeStory = null)}
  />
{/if}
