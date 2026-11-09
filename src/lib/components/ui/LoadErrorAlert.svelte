<script lang="ts">
  import { RefreshCw, TriangleAlert } from '#lib/components/icons.js'

  interface Props {
    title: string
    error: { status?: number; message: string; hint?: string }
    onReload: () => void
  }

  let { title, error, onReload }: Props = $props()
</script>

<div
  class="alert alert-vertical alert-warning sm:alert-horizontal"
  role="alert"
>
  <TriangleAlert
    aria-hidden="true"
    class="h-5 w-5"
  />
  <div>
    <h2 class="font-semibold">{title}</h2>
    <p class="text-sm">
      {#if error.status}
        HTTP {error.status}: {error.message}
      {:else}
        {error.message}
      {/if}
    </p>
    {#if error.hint}
      <p class="text-sm opacity-75">{error.hint}</p>
    {/if}
  </div>
  <button
    type="button"
    class="btn btn-sm"
    onclick={onReload}
  >
    <RefreshCw
      aria-hidden="true"
      class="h-4 w-4"
    />
    Opnieuw laden
  </button>
</div>
