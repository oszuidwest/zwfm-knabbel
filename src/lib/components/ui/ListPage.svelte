<script
  lang="ts"
  generics="T extends { id?: number; name?: string }"
>
  import { Plus, Pencil, Trash2, Eye } from '#lib/components/icons.js'
  import { PageHeader, EmptyState, Pagination } from '#lib/components/ui/index.js'
  import type { PaginationInfo } from '#lib/utils/pagination.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
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
    cardContent: Snippet<[T]>
    tableHeader: Snippet
    tableRow: Snippet<[T]>
    onDelete?: (item: T, e?: Event) => void
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
    icon: Icon,
    newHref,
    newLabel = 'Nieuw',
    editHref,
    emptyTitle,
    emptyDescription,
    pagination,
    cardContent,
    tableHeader,
    tableRow,
    onDelete,
    deleteLabel = (item: T) => item.name ?? 'dit item',
    canCreate = true,
    canEdit = true,
    canDelete = true,
    forbidTooltip = 'Geen rechten',
  }: Props = $props()

  const EditIcon = $derived(canEdit ? Pencil : Eye)

  function handleDeleteClick(item: T, e: Event): void {
    e.stopPropagation()
    if (!canDelete) return
    onDelete?.(item, e)
  }
</script>

<div class="space-y-4 pb-20 md:pb-0">
  <PageHeader
    {title}
    {subtitle}
    actionHref={newHref}
    actionLabel={newLabel}
    canAction={canCreate}
    {forbidTooltip}
  />

  {#if items.length === 0}
    <EmptyState
      icon={Icon}
      title={emptyTitle}
      description={emptyDescription}
      action={newHref && canCreate ? { href: newHref, label: newLabel } : undefined}
    />
  {:else}
    <div class="space-y-2 md:hidden">
      {#each items as item (item.id)}
        <div class="card bg-base-100">
          <div class="card-body p-4">
            <div class="flex items-center justify-between gap-3">
              <svelte:element
                this={editHref ? 'a' : 'div'}
                href={editHref && resolveInternalHref(editHref(item))}
                class={[
                  'flex min-w-0 flex-1 items-center gap-3',
                  editHref && 'rounded-field active:bg-base-200',
                ]}
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-(--color-primary-ink)"
                >
                  <Icon
                    aria-hidden="true"
                    class="h-5 w-5"
                  />
                </div>
                <div class="min-w-0">
                  {@render cardContent(item)}
                </div>
              </svelte:element>
              {#if onDelete}
                <div class="flex gap-1">
                  {#if editHref}
                    <a
                      href={resolveInternalHref(editHref(item))}
                      class="btn btn-square shrink-0 btn-ghost btn-sm"
                      aria-label={canEdit ? 'Bewerken' : 'Bekijken'}
                    >
                      <EditIcon
                        aria-hidden="true"
                        class="h-4 w-4"
                      />
                    </a>
                  {/if}
                  <MaybeTooltip
                    when={!canDelete}
                    tip={forbidTooltip}
                  >
                    <button
                      class={[
                        'btn btn-square shrink-0 btn-ghost btn-sm',
                        canDelete && 'hover:text-error',
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
