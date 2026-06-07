<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { RefreshCw, TriangleAlert } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'
  import TTSSettingsForm from './TTSSettingsForm.svelte'
  import type { TTSSettings } from '$lib/types'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  function settingsKey(settings: TTSSettings): string {
    return JSON.stringify({
      model: settings.model,
      stability: settings.stability,
      similarity_boost: settings.similarity_boost,
      style: settings.style,
      use_speaker_boost: settings.use_speaker_boost,
      speed: settings.speed,
      apply_text_normalization: settings.apply_text_normalization,
      seed: settings.seed,
      tts_style_prefix: settings.tts_style_prefix,
      updated_at: settings.updated_at,
      api_key_configured: settings.api_key_configured,
    })
  }

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
    {#key settingsKey(data.settings)}
      <TTSSettingsForm settings={data.settings} />
    {/key}
  {/if}
</div>
