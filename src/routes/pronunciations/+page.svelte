<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { RefreshCw, TriangleAlert } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'
  import PronunciationRulesForm from './PronunciationRulesForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  const auth = getAuthContext()

  const subtitle = 'Beheer lokale inline IPA-regels voor tekst-naar-spraak generatie.'
  const formKey = $derived(
    [data.initial.updated_at, data.initial.rules.length].filter(Boolean).join('|')
  )

  async function reloadPronunciations(): Promise<void> {
    try {
      await invalidateAll()
    } catch (err) {
      console.error('[pronunciations] reload failed', err)
      toast.error('Herladen mislukt')
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Uitspraakregels"
    {subtitle}
  />

  {#if data.loadError}
    <div
      class="alert alert-warning"
      role="alert"
    >
      <TriangleAlert
        aria-hidden="true"
        class="h-5 w-5"
      />
      <div>
        <h2 class="font-semibold">Uitspraakregels niet beschikbaar</h2>
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
        onclick={reloadPronunciations}
      >
        <RefreshCw
          aria-hidden="true"
          class="h-4 w-4"
        />
        Opnieuw laden
      </button>
    </div>
  {/if}

  {#if !data.loadError}
    {#key formKey}
      <PronunciationRulesForm
        initial={data.initial}
        canEdit={auth.can('pronunciation_rules', 'write')}
      />
    {/key}
  {/if}
</div>
