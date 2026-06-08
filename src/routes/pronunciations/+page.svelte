<script lang="ts">
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { Info } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'
  import PronunciationRulesForm from './PronunciationRulesForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  const auth = getAuthContext()

  const subtitle =
    'Beheer hoe ElevenLabs specifieke woorden uitspreekt voor de tekst-naar-spraak generatie.'
</script>

<div class="space-y-6">
  <PageHeader
    title="Uitspraakregels"
    {subtitle}
  />

  {#if !auth.canEditPronunciations}
    <div
      class="alert alert-info"
      role="status"
    >
      <Info
        aria-hidden="true"
        class="h-5 w-5"
      />
      <span>Alleen-lezen weergave — je hebt geen schrijfrechten.</span>
    </div>
  {/if}

  {#key JSON.stringify(data.initial)}
    <PronunciationRulesForm
      initial={data.initial}
      ttsUnavailable={data.ttsUnavailable}
      canEdit={auth.canEditPronunciations}
    />
  {/key}
</div>
