<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { RefreshCw, TriangleAlert } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'
  import TTSSettingsForm from './TTSSettingsForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  const auth = getAuthContext()

  async function reloadSettings(): Promise<void> {
    await invalidateAll()
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Tekst-naar-spraak"
    subtitle="Globale ElevenLabs v3-instellingen"
  />

  {#if data.loadError}
    <div class="alert border-warning/30 bg-warning/10 text-base-content">
      <TriangleAlert
        class="h-5 w-5 text-warning"
        aria-hidden="true"
      />
      <div>
        <h2 class="font-semibold">Tekst-naar-spraak niet beschikbaar</h2>
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
  {/if}

  {#if !data.loadError && data.settings}
    {#key JSON.stringify(data.settings)}
      <TTSSettingsForm
        settings={data.settings}
        canEdit={auth.can('settings_tts', 'write')}
      />
    {/key}
  {/if}
</div>
