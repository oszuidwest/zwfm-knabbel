<script lang="ts">
  import { page } from '$app/stores'
  import { ChevronLeft, ChevronRight } from '$lib/components/icons'
  import { getVisiblePages, type PaginationInfo } from '$lib/utils/pagination'

  interface Props {
    pagination: PaginationInfo
  }

  let { pagination }: Props = $props()

  const visiblePages = $derived(getVisiblePages(pagination.currentPage, pagination.totalPages))

  function pageHref(pageNum: number): string {
    const url = new URL($page.url)
    if (pageNum === 1) {
      url.searchParams.delete('page')
    } else {
      url.searchParams.set('page', String(pageNum))
    }
    return `${url.pathname}${url.search}${url.hash}`
  }
</script>

{#if pagination.totalPages > 1}
  <nav
    class="flex justify-center"
    aria-label="Paginering"
  >
    <div class="join">
      {#if pagination.hasPrevPage}
        <a
          class="btn join-item btn-sm md:btn-md"
          href={pageHref(pagination.currentPage - 1)}
          aria-label="Vorige pagina"
        >
          <ChevronLeft
            aria-hidden="true"
            class="h-4 w-4"
          />
          <span class="hidden sm:inline">Vorige</span>
        </a>
      {:else}
        <span
          class="btn btn-disabled join-item btn-sm md:btn-md"
          aria-disabled="true"
          aria-label="Vorige pagina"
        >
          <ChevronLeft
            aria-hidden="true"
            class="h-4 w-4"
          />
          <span class="hidden sm:inline">Vorige</span>
        </span>
      {/if}

      <div class="hidden sm:contents">
        {#each visiblePages as item, i (i)}
          {#if item === 'ellipsis'}
            <span class="btn btn-disabled join-item btn-sm md:btn-md">...</span>
          {:else}
            <a
              class="btn join-item btn-sm md:btn-md"
              class:btn-active={item === pagination.currentPage}
              href={pageHref(item)}
              aria-label="Pagina {item}"
              aria-current={item === pagination.currentPage ? 'page' : undefined}
            >
              {item}
            </a>
          {/if}
        {/each}
      </div>

      <span class="btn join-item btn-sm sm:hidden">
        {pagination.currentPage} / {pagination.totalPages}
      </span>

      {#if pagination.hasNextPage}
        <a
          class="btn join-item btn-sm md:btn-md"
          href={pageHref(pagination.currentPage + 1)}
          aria-label="Volgende pagina"
        >
          <span class="hidden sm:inline">Volgende</span>
          <ChevronRight
            aria-hidden="true"
            class="h-4 w-4"
          />
        </a>
      {:else}
        <span
          class="btn btn-disabled join-item btn-sm md:btn-md"
          aria-disabled="true"
          aria-label="Volgende pagina"
        >
          <span class="hidden sm:inline">Volgende</span>
          <ChevronRight
            aria-hidden="true"
            class="h-4 w-4"
          />
        </span>
      {/if}
    </div>
  </nav>
{/if}
