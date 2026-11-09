<script lang="ts">
  import { refreshAll } from '$app/navigation'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { LoadErrorAlert, PageHeader } from '#lib/components/ui/index.js'
  import TTSSettingsForm from './TTSSettingsForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  const auth = getAuthContext()
</script>

<div class="space-y-6">
  <PageHeader
    title="Spraakgeneratie"
    subtitle="Globale instellingen voor ElevenLabs"
  />

  {#if data.loadError}
    <LoadErrorAlert
      title="Spraakgeneratie niet beschikbaar"
      error={data.loadError}
      onReload={() => refreshAll()}
    />
  {:else if data.settings}
    {#key JSON.stringify(data.settings)}
      <TTSSettingsForm
        settings={data.settings}
        canEdit={auth.can('settings:tts', 'write')}
      />
    {/key}
  {/if}
</div>
