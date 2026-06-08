<script
  lang="ts"
  generics="T extends { id?: number; name?: string }"
>
  import { Plus, Pencil, Trash2, Eye } from '$lib/components/icons'
  import { PageHeader, EmptyState, Pagination } from '$lib/components/ui'
  import type { PaginationInfo } from '$lib/utils/pagination'
  import { resolveInternalHref } from '$lib/utils/routes'
  import MaybeTooltip from './MaybeTooltip.svelte'
  import type { Component, Snippet } from 'svelte'

  interface Props {
    title: string
    subtitle: string
    items: T[]
    icon: Component
    newHref?: string
    newLabel?: string
    editHref?: (item: T) => string
    emptyTitle: string
    emptyDescription: string
    pagination?: PaginationInfo
    headerActions?: Snippet
    cardContent: Snippet<[T]>
    /** Custom card actions. If not provided and onDelete is set, default edit/delete buttons are shown */
    cardActions?: Snippet<[T]>
    tableHeader: Snippet
    tableRow: Snippet<[T]>
    /** Called when delete button is clicked. Required for default cardActions to show */
    onDelete?: (item: T, e?: Event) => void
    /** Label for delete button aria-label. Defaults to item.name or 'dit item' */
    deleteLabel?: (item: T) => string
    canCreate?: boolean
    canEdit?: boolean
    canDelete?: boolean
    forbidTooltip?: string
  }

  let {
    title,
    subtitle,
    items,
    icon,
    newHref,
    newLabel = 'Nieuw',
    editHref,
    emptyTitle,
    emptyDescription,
    pagination,
    headerActions,
    cardContent,
    cardActions,
    tableHeader,
    tableRow,
    onDelete,
    deleteLabel = (item: T) => item.name ?? 'dit item',
    canCreate = true,
    canEdit = true,
    canDelete = true,
    forbidTooltip = 'Geen rechten',
  }: Props = $props()

  function handleDeleteClick(item: T, e: Event): void {
    e.stopPropagation()
    if (!canDelete) return
    onDelete?.(item, e)
  }

  function handleCreateClick(e: MouseEvent): void {
    if (!canCreate) {
      e.preventDefault()
    }
  }
</script>

<div class="space-y-4 pb-20 md:pb-0">
  <PageHeader
    {title}
    {subtitle}
  >
    {#snippet actions()}
      {#if headerActions}
        {@render headerActions()}
      {:else if newHref}
        <MaybeTooltip
          when={!canCreate}
          tip={forbidTooltip}
          wrapperClass="max-md:hidden"
        >
          <a
            href={canCreate ? resolveInternalHref(newHref) : undefined}
            class={['btn btn-primary', !canCreate && 'btn-disabled']}
            role={canCreate ? undefined : 'button'}
            aria-disabled={!canCreate}
            tabindex={canCreate ? undefined : -1}
            onclick={handleCreateClick}
          >
            <Plus
              aria-hidden="true"
              class="h-5 w-5"
            />
            {newLabel}
          </a>
        </MaybeTooltip>
      {/if}
    {/snippet}
  </PageHeader>

  {#if items.length === 0}
    <EmptyState
      {icon}
      title={emptyTitle}
      description={emptyDescription}
      action={newHref && canCreate ? { href: newHref, label: newLabel } : undefined}
    />
  {:else}
    <!-- Mobile: Cards view -->
    <div class="space-y-2 md:hidden">
      {#each items as item (item.id)}
        {@const Icon = icon}
        {@const isClickable = !!editHref}
        <div class="card bg-base-100 transition-shadow hover:shadow-md">
          <div class="card-body p-4">
            <div class="flex items-center justify-between gap-3">
              {#if isClickable}
                <a
                  href={resolveInternalHref(editHref(item))}
                  class="flex min-w-0 flex-1 items-center gap-3 rounded-field active:bg-base-200"
                >
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <Icon
                      aria-hidden="true"
                      class="h-5 w-5"
                    />
                  </div>
                  <div class="min-w-0">
                    {@render cardContent(item)}
                  </div>
                </a>
              {:else}
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <Icon
                      aria-hidden="true"
                      class="h-5 w-5"
                    />
                  </div>
                  <div class="min-w-0">
                    {@render cardContent(item)}
                  </div>
                </div>
              {/if}
              {#if cardActions}
                <div class="flex gap-1">
                  {@render cardActions(item)}
                </div>
              {:else if onDelete}
                <div class="flex gap-1">
                  {#if editHref}
                    <a
                      href={resolveInternalHref(editHref(item))}
                      class="btn btn-square shrink-0 btn-ghost btn-sm"
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
                  {/if}
                  <MaybeTooltip
                    when={!canDelete}
                    tip={forbidTooltip}
                    placement="tooltip-left"
                  >
                    <button
                      class={[
                        'btn btn-square shrink-0 btn-ghost btn-sm',
                        canDelete && 'text-error',
                      ]}
                      onclick={e => handleDeleteClick(item, e)}
                      disabled={!canDelete}
                      aria-label="Verwijder {deleteLabel(item)}"
                    >
                      <Trash2
                        aria-hidden="true"
                        class="h-4 w-4"
                      />
                    </button>
                  </MaybeTooltip>
                </div>
              {/if}
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
              {@render tableHeader()}
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr>
                {@render tableRow(item)}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if pagination}
      <Pagination {pagination} />
    {/if}
  {/if}
</div>

<!-- FAB: New item button (mobile only) -->
{#if newHref && canCreate}
  <a
    href={resolveInternalHref(newHref)}
    class="btn fixed right-6 bottom-6 z-40 btn-circle shadow-lg btn-lg btn-primary md:hidden"
    aria-label={newLabel}
  >
    <Plus
      aria-hidden="true"
      class="h-6 w-6"
    />
  </a>
{/if}
