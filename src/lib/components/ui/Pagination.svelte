<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { ChevronLeft, ChevronRight } from '$lib/components/icons'
  import { getVisiblePages, type PaginationInfo } from '$lib/utils/pagination'

  interface Props {
    pagination: PaginationInfo
  }

  let { pagination }: Props = $props()

  const visiblePages = $derived(getVisiblePages(pagination.currentPage, pagination.totalPages))

  function goToPage(pageNum: number) {
    const url = new URL($page.url)
    if (pageNum === 1) {
      url.searchParams.delete('page')
    } else {
      url.searchParams.set('page', String(pageNum))
    }
    goto(url.toString(), { invalidateAll: true })
  }
</script>

{#if pagination.totalPages > 1}
  <nav
    class="flex justify-center"
    aria-label="Paginering"
  >
    <div class="join">
      <button
        class="btn join-item btn-sm md:btn-md"
        onclick={() => goToPage(pagination.currentPage - 1)}
        disabled={!pagination.hasPrevPage}
        aria-label="Vorige pagina"
      >
        <ChevronLeft
          aria-hidden="true"
          class="h-4 w-4"
        />
        <span class="hidden sm:inline">Vorige</span>
      </button>

      <div class="hidden sm:contents">
        {#each visiblePages as item, i (i)}
          {#if item === 'ellipsis'}
            <span class="btn btn-disabled join-item btn-sm md:btn-md">...</span>
          {:else}
            <button
              class="btn join-item btn-sm md:btn-md"
              class:btn-active={item === pagination.currentPage}
              onclick={() => goToPage(item)}
              aria-label="Pagina {item}"
              aria-current={item === pagination.currentPage ? 'page' : undefined}
            >
              {item}
            </button>
          {/if}
        {/each}
      </div>

      <span class="btn join-item btn-sm sm:hidden">
        {pagination.currentPage} / {pagination.totalPages}
      </span>

      <button
        class="btn join-item btn-sm md:btn-md"
        onclick={() => goToPage(pagination.currentPage + 1)}
        disabled={!pagination.hasNextPage}
        aria-label="Volgende pagina"
      >
        <span class="hidden sm:inline">Volgende</span>
        <ChevronRight
          aria-hidden="true"
          class="h-4 w-4"
        />
      </button>
    </div>
  </nav>
{/if}
