<script lang="ts">
  import { goto } from '$app/navigation'
  import { getFieldErrors, notifyMutationError } from '#lib/api/client.js'
  import { stationSchema, type StationFormData } from '#lib/schemas/station.js'
  import { postStations, putStationsId } from '#lib/api/generated/sdk.gen.js'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { toast } from '#lib/stores/toast.js'
  import { validateForm } from '#lib/utils/validation.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import { TextInput, NumberInput, FormActions, PageHeader } from '#lib/components/ui/index.js'
  import type { Station } from '#lib/types/index.js'

  interface Props {
    /** The station to edit; without it the form creates a new one. */
    station?: Station
  }

  let { station }: Props = $props()
  const auth = getAuthContext()

  function initialForm(): StationFormData {
    return {
      name: station?.name ?? '',
      max_stories_per_block: station?.max_stories_per_block ?? 5,
      pause_seconds: station?.pause_seconds ?? 2,
    }
  }

  let form = $state<StationFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  const canWrite = $derived(auth.can('stations', 'write'))

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    if (!canWrite) return

    const result = validateForm(stationSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      if (station) {
        await putStationsId({ path: { id: station.id }, body: form })
        toast.success('Zender bijgewerkt')
      } else {
        await postStations({ body: form })
        toast.success('Zender aangemaakt')
      }
      await goto(resolveInternalHref('/stations'))
    } catch (err) {
      errors = getFieldErrors(err)
      notifyMutationError(err, station ? 'Bijwerken mislukt' : 'Aanmaken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title={station ? (canWrite ? 'Zender bewerken' : 'Zender bekijken') : 'Nieuwe zender'}
    subtitle={station ? (station.name ?? '') : 'Voeg een nieuwe zender toe aan het systeem'}
  />

  <div class="card bg-base-100">
    <div class="card-body">
      <form
        onsubmit={handleSubmit}
        class="space-y-6"
      >
        <TextInput
          id="name"
          label="Naam"
          bind:value={form.name}
          error={errors.name}
          placeholder={station ? 'Bijv. Radio ZuidWest FM' : 'Bijvoorbeeld: ZuidWest FM'}
          disabled={!canWrite}
        />

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <NumberInput
            id="max_stories_per_block"
            label="Max berichten per blok"
            bind:value={form.max_stories_per_block}
            error={errors.max_stories_per_block}
            min={1}
            max={20}
            hint="Hoeveel berichten maximaal in een bulletin"
            disabled={!canWrite}
          />

          <NumberInput
            id="pause_seconds"
            label="Pauze tussen berichten (sec)"
            bind:value={form.pause_seconds}
            error={errors.pause_seconds}
            min={0}
            max={10}
            step={0.5}
            hint="Stilte tussen de berichten in het bulletin"
            disabled={!canWrite}
          />
        </div>

        <FormActions
          cancelHref="/stations"
          {submitting}
          canSubmit={canWrite}
        />
      </form>
    </div>
  </div>
</div>
