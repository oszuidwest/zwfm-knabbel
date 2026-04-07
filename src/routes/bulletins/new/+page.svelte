<script lang="ts">
  import { goto } from '$app/navigation'
  import { bulletinsApi } from '$lib/api/bulletins'
  import { toast } from '$lib/stores/toast'
  import { RefreshCw, X } from '$lib/components/icons'
  import { PageHeader, SelectInput } from '$lib/components/ui'
  import { toSelectOptions } from '$lib/utils/form'

  let { data } = $props()

  let selectedStation = $state('')
  let generating = $state(false)

  const stationOptions = $derived(toSelectOptions(data.stations))

  async function handleGenerate(e: Event): Promise<void> {
    e.preventDefault()

    if (!selectedStation) {
      toast.error('Selecteer eerst een zender')
      return
    }

    generating = true
    try {
      const bulletin = await bulletinsApi.generate(Number(selectedStation))
      toast.success('Bulletin gegenereerd')
      goto(`/bulletins/${bulletin.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Genereren mislukt'
      toast.error(message)
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
        />

        <div class="rounded-lg bg-base-200 p-4">
          <h3 class="mb-2 font-medium">Wat gebeurt er?</h3>
          <ul class="list-inside list-disc space-y-1 text-sm text-base-content/70">
            <li>Actieve berichten voor deze zender worden opgehaald</li>
            <li>De nieuwslezer van de zender spreekt de berichten in</li>
            <li>Een audio bestand wordt gegenereerd</li>
          </ul>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <a
            href="/bulletins"
            class="btn btn-ghost"
          >
            <X class="h-5 w-5" />
            Annuleren
          </a>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={generating || !selectedStation}
          >
            {#if generating}
              <span class="loading loading-sm loading-spinner"></span>
            {:else}
              <RefreshCw
                aria-hidden="true"
                class="h-5 w-5"
              />
            {/if}
            Genereren
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
