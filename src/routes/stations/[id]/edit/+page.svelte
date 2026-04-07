<script lang="ts">
  import { goto } from '$app/navigation'
  import { stationSchema, type StationFormData } from '$lib/schemas/station'
  import { stationsApi } from '$lib/api/stations'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { TextInput, NumberInput, FormActions, PageHeader } from '$lib/components/ui'

  let { data } = $props()

  let form = $state<StationFormData>({
    name: '',
    max_stories_per_block: 5,
    pause_seconds: 2,
  })
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  // Reset form when data changes (navigation between stations or after save)
  $effect(() => {
    form = {
      name: data.station.name ?? '',
      max_stories_per_block: data.station.max_stories_per_block ?? 5,
      pause_seconds: data.station.pause_seconds ?? 2,
    }
    errors = {}
  })

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

    const result = validateForm(stationSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      await stationsApi.update(data.station.id!, form)
      toast.success('Zender bijgewerkt')
      goto('/stations')
    } catch {
      toast.error('Bijwerken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Zender bewerken"
    subtitle={data.station.name ?? ''}
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
          placeholder="Bijv. Radio ZuidWest FM"
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
          />
        </div>

        <FormActions
          cancelHref="/stations"
          {submitting}
        />
      </form>
    </div>
  </div>
</div>
