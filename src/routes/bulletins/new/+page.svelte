<script lang="ts">
  import { goto } from '$app/navigation'
  import { onDestroy } from 'svelte'
  import { notifyMutationError } from '$lib/api/client'
  import { generateBulletin } from '$lib/api/bulletins'
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
  let generationController: AbortController | undefined

  const stationOptions = $derived(toSelectOptions(data.stations))
  const canGenerate = $derived(auth.can('bulletins', 'generate'))

  onDestroy(() => generationController?.abort())

  async function handleGenerate(e: Event): Promise<void> {
    e.preventDefault()
    if (!canGenerate) return

    if (!selectedStation) {
      toast.error('Selecteer eerst een zender')
      return
    }

    generating = true
    const controller = new AbortController()
    generationController = controller
    try {
      const bulletin = await generateBulletin(Number(selectedStation), controller.signal)
      toast.success('Bulletin gegenereerd')
      goto(resolveInternalHref(`/bulletins/${bulletin.id}`))
    } catch (err) {
      if (!controller.signal.aborted) {
        notifyMutationError(err, 'Genereren mislukt')
      }
    } finally {
      if (generationController === controller) {
        generationController = undefined
      }
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
            <li>De backend zet de generatie in de wachtrij</li>
            <li>Je gaat automatisch naar het bulletin zodra het audiobestand klaar is</li>
          </ul>
        </div>

        <FormActions
          cancelHref="/bulletins"
          submitting={generating}
          submitLabel={generating ? 'Bulletin wordt gemaakt…' : 'Genereren'}
          submitIcon={RefreshCw}
          canSubmit={canGenerate && !!selectedStation}
          forbidTooltip={canGenerate ? 'Selecteer eerst een zender' : 'Geen rechten'}
        />
      </form>
    </div>
  </div>
</div>
