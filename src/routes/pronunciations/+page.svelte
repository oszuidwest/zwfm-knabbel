<script lang="ts">
  import { refreshAll } from '$app/navigation'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { toast } from '#lib/stores/toast.js'
  import { LoadErrorAlert, PageHeader } from '#lib/components/ui/index.js'
  import PronunciationRulesForm from './PronunciationRulesForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  const auth = getAuthContext()

  const formKey = $derived(
    [data.initial.updated_at, data.initial.rules.length].filter(Boolean).join('|')
  )

  async function reloadPronunciations(): Promise<void> {
    try {
      await refreshAll()
    } catch (err) {
      console.error('[pronunciations] reload failed', err)
      toast.error('Herladen mislukt')
    }
  }
</script>

<div class="space-y-6">
  {#if data.loadError}
    <PageHeader
      title="Uitspraakregels"
      subtitle="Uitspraak voor ElevenLabs"
    />

    <LoadErrorAlert
      title="Uitspraakregels niet beschikbaar"
      error={data.loadError}
      onReload={reloadPronunciations}
    />
  {:else}
    {#key formKey}
      <PronunciationRulesForm
        initial={data.initial}
        canEdit={auth.can('pronunciation_rules', 'write')}
      />
    {/key}
  {/if}
</div>
