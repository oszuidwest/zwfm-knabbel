<script lang="ts">
  import { page } from '$app/stores'
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body items-center text-center">
      <h1 class="text-6xl font-bold text-error">{$page.status}</h1>
      <p class="mt-4 text-xl text-base-content/70">
        {#if $page.status === 404}
          Pagina niet gevonden
        {:else if $page.status === 403}
          Geen toegang
        {:else if $page.status === 500}
          Server fout
        {:else}
          {$page.error?.message ?? 'Er is iets misgegaan'}
        {/if}
      </p>
      <div class="mt-6 card-actions">
        <a
          href="/"
          class="btn btn-primary">Terug naar home</a
        >
      </div>
    </div>
  </div>
</div>
