<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { deleteStoriesId } from '$lib/api/generated/sdk.gen'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { deleteWithConfirm } from '$lib/utils/crud'
  import { formatDate, formatDateTime, formatRelativeTime, parseDate } from '$lib/utils/format'
  import { resolveInternalHref } from '$lib/utils/routes'
  import { statusLabels, statusColors, statusOptions } from '$lib/utils/labels'
  import {
    ArchiveRestore,
    FileText,
    Info,
    Play,
    Plus,
    Search,
    CassetteTape,
    SlidersHorizontal,
    Trash2,
    Zap,
  } from '$lib/components/icons'
  import {
    PageHeader,
    EmptyState,
    TableActions,
    MaybeTooltip,
    Modal,
    Pagination,
  } from '$lib/components/ui'
  import ReadMode from '$lib/components/ReadMode.svelte'
  import RestoreStoryDialog from './RestoreStoryDialog.svelte'
  import type { Story } from '$lib/types'

  let { data } = $props()
  const auth = getAuthContext()
  let showFilterModal = $state(false)
  let readModeStory = $state.raw<Story | null>(null)
  let restoreStory = $state.raw<Story | null>(null)

  const statusFilter = $derived(page.url.searchParams.get('status') ?? '')
  const dateFilter = $derived(page.url.searchParams.get('date') ?? '')
  const audioFilter = $derived(page.url.searchParams.get('audio') ?? '')
  const searchQuery = $derived(page.url.searchParams.get('q') ?? '')
  const trashView = $derived(page.url.searchParams.get('trashed') === 'only')

  const hiddenFilterCount = $derived((statusFilter ? 1 : 0) + (searchQuery ? 1 : 0))
  const hasActiveFilters = $derived(!!(statusFilter || dateFilter || audioFilter || searchQuery))
  const canWrite = $derived(auth.can('stories', 'write'))
  const countLabel = $derived.by(() => {
    const total = data.pagination.totalItems
    if (trashView) return `${total} ${total === 1 ? 'verwijderd bericht' : 'verwijderde berichten'}`
    return `${total} ${total === 1 ? 'bericht' : 'berichten'}`
  })

  function updateFilters(updates: Record<string, string>): void {
    const url = new URL(page.url)
    // New filters can make the current page number invalid.
    url.searchParams.delete('page')
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    }
    goto(resolveInternalHref(`${url.pathname}${url.search}${url.hash}`))
  }

  const handleDelete = (story: Story) =>
    deleteWithConfirm({
      name: story.title ?? 'dit bericht',
      warning: story.metadata?.wordpress_id
        ? 'Dit bericht komt uit WordPress. WordPress merkt het verwijderen niet op. Latere wijzigingen vanuit WordPress mislukken dan. Zet liever in WordPress "Radionieuws" uit.'
        : undefined,
      deleteFn: () => deleteStoriesId({ path: { id: story.id } }),
      onSuccess: () => invalidateAll(),
      successMessage: 'Bericht verplaatst naar de prullenbak',
    })

  async function handleRestored(story: Story, edit: boolean): Promise<void> {
    // Closing the dialog during the restore drops the move to the edit page.
    if (restoreStory !== story) return invalidateAll()
    restoreStory = null
    if (edit) {
      await goto(resolveInternalHref(`/stories/${story.id}/edit`))
    } else {
      await invalidateAll()
    }
  }

  function formatDateLabel(type: 'today' | 'tomorrow'): string {
    const date = new Date()
    if (type === 'tomorrow') {
      date.setDate(date.getDate() + 1)
    }
    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatCompactDateRange(
    startDate: string | undefined,
    endDate: string | undefined
  ): string {
    const formatCompact = (dateStr: string | undefined) => {
      if (!dateStr) return ''
      return parseDate(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
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
    title={trashView ? 'Prullenbak' : 'Berichten'}
    subtitle={countLabel}
    actionHref={trashView ? undefined : '/stories/new'}
    actionLabel="Nieuw bericht"
    canAction={canWrite}
  />

  <div class="flex flex-wrap items-center gap-2">
    <div class="tabs tabs-box tabs-sm md:tabs-md">
      <button
        class={['tab', dateFilter === '' && 'tab-active']}
        aria-pressed={dateFilter === ''}
        onclick={() => updateFilters({ date: '', status: '' })}
      >
        Alle
      </button>
      <button
        class={['tab', dateFilter === 'today' && 'tab-active']}
        aria-pressed={dateFilter === 'today'}
        onclick={() => updateFilters({ date: 'today' })}
      >
        Vandaag
        <span class="ml-1 hidden text-xs opacity-60 sm:inline">({formatDateLabel('today')})</span>
      </button>
      <button
        class={['tab', dateFilter === 'tomorrow' && 'tab-active']}
        aria-pressed={dateFilter === 'tomorrow'}
        onclick={() => updateFilters({ date: 'tomorrow' })}
      >
        Morgen
        <span class="ml-1 hidden text-xs opacity-60 sm:inline">({formatDateLabel('tomorrow')})</span
        >
      </button>
    </div>

    <select
      class="select select-sm"
      value={audioFilter}
      onchange={e => updateFilters({ audio: e.currentTarget.value })}
      aria-label="Filter op audio"
    >
      <option value="">Audio: alle</option>
      <option value="without">Zonder audio</option>
      <option value="with">Met audio</option>
    </select>

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

    <div class="hidden items-center gap-2 md:flex">
      <select
        class="select select-sm"
        value={statusFilter}
        onchange={e => updateFilters({ status: e.currentTarget.value })}
        aria-label="Filter op status"
      >
        <option value="">Alle statussen</option>
        {#each statusOptions as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>

      <label class="input input-sm">
        <Search
          aria-hidden="true"
          class="h-4 w-4 text-base-content/40"
        />
        <input
          type="search"
          placeholder="Zoeken..."
          value={searchQuery}
          onchange={e => updateFilters({ q: e.currentTarget.value })}
          aria-label="Zoeken in berichten"
        />
      </label>
    </div>

    <button
      type="button"
      class={['btn btn-sm md:ml-auto', trashView ? 'btn-neutral' : 'btn-ghost']}
      aria-pressed={trashView}
      onclick={() => updateFilters({ trashed: trashView ? '' : 'only' })}
    >
      <Trash2
        aria-hidden="true"
        class="h-4 w-4"
      />
      Prullenbak
    </button>
  </div>

  {#if trashView}
    <div
      class="alert alert-soft text-sm"
      role="note"
    >
      <Info
        aria-hidden="true"
        class="h-5 w-5 shrink-0"
      />
      <span>
        Verwijderde berichten komen niet in bulletins. Herstellen zet een bericht terug met de
        status en planning die het had.
      </span>
    </div>
  {/if}

  {#if data.stories.length === 0}
    {#if trashView}
      <EmptyState
        icon={Trash2}
        title="Prullenbak is leeg"
        description={hasActiveFilters
          ? 'Geen verwijderde berichten gevonden met deze filters.'
          : 'Verwijderde berichten verschijnen hier.'}
      />
    {:else}
      <EmptyState
        icon={FileText}
        title="Geen berichten"
        description={hasActiveFilters
          ? 'Geen berichten gevonden met deze filters.'
          : canWrite
            ? 'Maak je eerste bericht aan om te beginnen.'
            : 'Nog geen berichten aanwezig.'}
        action={!hasActiveFilters && canWrite
          ? { href: '/stories/new', label: 'Nieuw bericht' }
          : undefined}
      />
    {/if}
  {:else}
    <div class="space-y-2 md:hidden">
      {#each data.stories as story (story.id)}
        <div class={['card bg-base-100', !trashView && 'transition-shadow hover:shadow-md']}>
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              {#if trashView}
                <div class="min-w-0 flex-1">
                  {@render cardSummary(story)}
                </div>
                {@render restoreButton(story, 'h-5 w-5')}
              {:else}
                <a
                  href={resolveInternalHref(`/stories/${story.id}/edit`)}
                  class="min-w-0 flex-1 rounded-field active:bg-base-200"
                >
                  {@render cardSummary(story)}
                </a>
                {@render readModeButton(story, 'h-5 w-5')}
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

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
              {#if trashView}
                <th>Verwijderd</th>
              {/if}
              <th class="w-32">Acties</th>
            </tr>
          </thead>
          <tbody>
            {#each data.stories as story (story.id)}
              <tr>
                <td class="font-medium">
                  <span class="flex items-center gap-1.5">
                    {story.title}
                    {@render wordpressBadge(story)}
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
                <td class="whitespace-nowrap">{formatDate(story.start_date)}</td>
                <td class="whitespace-nowrap">{formatDate(story.end_date)}</td>
                {#if trashView}
                  <td class="whitespace-nowrap">{@render deletedAt(story)}</td>
                {/if}
                <td>
                  {#if trashView}
                    {@render restoreButton(story, 'h-4 w-4')}
                  {:else}
                    <div class="flex gap-1">
                      {@render readModeButton(story, 'h-4 w-4')}
                      <TableActions
                        editHref="/stories/{story.id}/edit"
                        onDelete={() => handleDelete(story)}
                        canEdit={canWrite}
                        canDelete={canWrite}
                      />
                    </div>
                  {/if}
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

{#if canWrite && !trashView}
  <a
    href={resolveInternalHref('/stories/new')}
    class="btn fixed right-6 bottom-6 z-40 btn-circle shadow-lg btn-lg btn-primary md:hidden"
    aria-label="Nieuw bericht"
  >
    <Plus
      aria-hidden="true"
      class="h-6 w-6"
    />
  </a>
{/if}

{#if showFilterModal}
  <Modal
    title="Filters"
    onclose={() => (showFilterModal = false)}
  >
    <div class="space-y-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Status</legend>
        <select
          id="modal-status"
          class="select w-full"
          value={statusFilter}
          onchange={e => updateFilters({ status: e.currentTarget.value })}
        >
          <option value="">Alle statussen</option>
          {#each statusOptions as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Zoeken</legend>
        <input
          id="modal-search"
          type="search"
          placeholder="Zoek in titel of tekst..."
          class="input w-full"
          value={searchQuery}
          onchange={e => updateFilters({ q: e.currentTarget.value })}
        />
      </fieldset>
    </div>

    {#snippet actions()}
      {#if hiddenFilterCount > 0}
        <button
          class="btn btn-ghost"
          onclick={clearHiddenFilters}
        >
          Filters wissen
        </button>
      {/if}
      <button
        class="btn btn-primary"
        onclick={() => (showFilterModal = false)}
      >
        Sluiten
      </button>
    {/snippet}
  </Modal>
{/if}

{#snippet cardSummary(story: Story)}
  <div class="flex items-center gap-2">
    <h3 class="truncate font-medium">{story.title}</h3>
    {@render wordpressBadge(story)}
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
  {#if story.deleted_at}
    <p class="mt-1 text-sm text-base-content/60">Verwijderd {@render deletedAt(story)}</p>
  {/if}
{/snippet}

{#snippet wordpressBadge(story: Story)}
  {#if story.metadata?.wordpress_id}
    <span class="badge shrink-0 badge-ghost badge-sm">WordPress</span>
  {/if}
{/snippet}

{#snippet deletedAt(story: Story)}
  {#if story.deleted_at}
    <time
      datetime={story.deleted_at}
      title={formatDateTime(story.deleted_at)}>{formatRelativeTime(story.deleted_at)}</time
    >
  {/if}
{/snippet}

{#snippet readModeButton(story: Story, iconClass: string)}
  <div
    class="tooltip tooltip-left"
    data-tip="Leesmodus"
  >
    <button
      type="button"
      class="btn btn-square btn-ghost btn-sm"
      onclick={() => (readModeStory = story)}
      aria-label="Open leesmodus voor {story.title}"
    >
      <CassetteTape
        aria-hidden="true"
        class={iconClass}
      />
    </button>
  </div>
{/snippet}

{#snippet restoreButton(story: Story, iconClass: string)}
  <MaybeTooltip
    when
    tip={canWrite ? 'Herstellen' : 'Geen rechten'}
    announce={!canWrite}
  >
    <button
      type="button"
      class="btn btn-square btn-ghost btn-sm"
      onclick={() => (restoreStory = story)}
      disabled={!canWrite}
      aria-label="Herstellen: {story.title}"
    >
      <ArchiveRestore
        aria-hidden="true"
        class={iconClass}
      />
    </button>
  </MaybeTooltip>
{/snippet}

{#if restoreStory}
  <RestoreStoryDialog
    story={restoreStory}
    onclose={() => (restoreStory = null)}
    ondone={handleRestored}
  />
{/if}

{#if readModeStory}
  <ReadMode
    text={readModeStory.text}
    onclose={() => (readModeStory = null)}
  />
{/if}
