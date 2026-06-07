<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { RefreshCw, TriangleAlert } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'
  import TTSSettingsForm from './TTSSettingsForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  async function reloadSettings(): Promise<void> {
    await invalidateAll()
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="AI-instellingen"
    subtitle="Globale ElevenLabs instellingen voor tekst-naar-spraak"
  />

  {#if data.loadError}
    <div class="alert border-warning/30 bg-warning/10 text-base-content">
      <TriangleAlert
        class="h-5 w-5 text-warning"
        aria-hidden="true"
      />
      <div>
        <h2 class="font-semibold">AI-instellingen niet beschikbaar</h2>
        <p class="text-sm">
          {#if data.loadError.status}
            HTTP {data.loadError.status}: {data.loadError.message}
          {:else}
            {data.loadError.message}
          {/if}
        </p>
        {#if data.loadError.hint}
          <p class="text-sm opacity-75">{data.loadError.hint}</p>
        {/if}
      </div>
      <button
        type="button"
        class="btn btn-sm"
        onclick={reloadSettings}
      >
        <RefreshCw class="h-4 w-4" />
        Opnieuw laden
      </button>
    </div>
  {:else if data.settings}
    {#key data.settings.updated_at}
      <TTSSettingsForm settings={data.settings} />
    {/key}
  {/if}
</div>
