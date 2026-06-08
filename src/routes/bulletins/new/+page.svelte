<script lang="ts">
  import { goto } from '$app/navigation'
  import { notifyMutationError } from '$lib/api/client'
  import { bulletinsApi } from '$lib/api/bulletins'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { resolveInternalHref } from '$lib/utils/routes'
  import { RefreshCw } from '$lib/components/icons'
  import { FormActions, PageHeader, SelectInput } from '$lib/components/ui'
  import { toSelectOptions } from '$lib/utils/form'

  let { data } = $props()
  const auth = getAuthContext()

  let selectedStation = $state('')
  let generating = $state(false)

  const stationOptions = $derived(toSelectOptions(data.stations))
  const canGenerate = $derived(auth.can('bulletins', 'generate'))

  async function handleGenerate(e: Event): Promise<void> {
    e.preventDefault()
    if (!canGenerate) return

    if (!selectedStation) {
      toast.error('Selecteer eerst een zender')
      return
    }

    generating = true
    try {
      const bulletin = await bulletinsApi.generate(Number(selectedStation))
      toast.success('Bulletin gegenereerd')
      goto(resolveInternalHref(`/bulletins/${bulletin.id}`))
    } catch (err) {
      notifyMutationError(err, err instanceof Error ? err.message : 'Genereren mislukt')
    } finally {
      generating = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Bulletin genereren"
    subtitle="Genereer een nieuw nieuwsbulletin voor een zender"
  />

  <div class="card bg-base-100">
    <div class="card-body">
      <form
        onsubmit={handleGenerate}
        class="space-y-6"
      >
        <SelectInput
          id="station"
          label="Zender"
          bind:value={selectedStation}
          options={stationOptions}
          placeholder="Selecteer een zender"
          disabled={!canGenerate}
        />

        <div class="rounded-lg bg-base-200 p-4">
          <h3 class="mb-2 font-medium">Wat gebeurt er?</h3>
          <ul class="list-inside list-disc space-y-1 text-sm text-base-content/70">
            <li>Actieve berichten voor deze zender worden opgehaald</li>
            <li>De nieuwslezer van de zender spreekt de berichten in</li>
            <li>Een audio bestand wordt gegenereerd</li>
          </ul>
        </div>

        <FormActions
          cancelHref="/bulletins"
          submitting={generating}
          submitLabel="Genereren"
          submitIcon={RefreshCw}
          canSubmit={canGenerate && !!selectedStation}
          forbidTooltip={canGenerate ? 'Selecteer eerst een zender' : 'Geen rechten'}
        />
      </form>
    </div>
  </div>
</div>
