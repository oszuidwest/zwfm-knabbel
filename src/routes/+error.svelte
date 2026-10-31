<script lang="ts">
  import { page } from '$app/state'
  import { resolveInternalHref } from '$lib/utils/routes'
</script>

<svelte:head>
  <title>{page.status} · Babbel</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
  <div class="card w-full max-w-md bg-base-100">
    <div class="card-body items-center text-center">
      <h1 class="text-5xl font-medium text-primary tabular-nums">{page.status}</h1>
      <p class="mt-4 text-lg">
        {#if page.status === 404}
          Pagina niet gevonden
        {:else if page.status === 403}
          Geen toegang
        {:else if page.status === 500}
          Serverfout
        {:else}
          {page.error?.message ?? 'Er is iets misgegaan'}
        {/if}
      </p>
      <div class="mt-6 card-actions">
        <a
          href={resolveInternalHref('/')}
          class="btn btn-primary">Terug naar home</a
        >
      </div>
    </div>
  </div>
</div>
