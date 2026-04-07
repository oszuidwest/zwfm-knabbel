<script lang="ts">
  import { goto } from '$app/navigation'
  import { voiceSchema, type VoiceFormData } from '$lib/schemas/voice'
  import { voicesApi } from '$lib/api/voices'
  import { stationVoicesApi } from '$lib/api/station-voices'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { TextInput, PageHeader } from '$lib/components/ui'
  import StationConfigDashboard from '$lib/components/StationConfigDashboard.svelte'
  import { X, Check } from '$lib/components/icons'
  import type { StationConfig, StationVoice } from '$lib/types'

  let { data } = $props()

  let form = $state<VoiceFormData>({ name: '' })
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let stationConfigs = $state<StationConfig[]>([])

  // Helper to build station configs from data
  function buildStationConfigs(): StationConfig[] {
    const stationVoiceMap = new Map<number, StationVoice>()
    for (const sv of data.stationVoices) {
      if (sv.station_id) {
        stationVoiceMap.set(sv.station_id, sv)
      }
    }

    return data.stations.map(station => {
      const sv = stationVoiceMap.get(station.id!)
      // audio_file is empty string if no audio, audio_url is always present
      const hasAudio = !!sv?.audio_file
      return {
        station,
        enabled: !!sv,
        stationVoiceId: sv?.id ?? null,
        mixPoint: sv?.mix_point ?? 0,
        audioUrl: hasAudio ? (sv?.audio_url ?? null) : null,
        hasAudio,
        jingleFile: null,
        saving: false,
      }
    })
  }

  // Reset form and station configs when data changes (navigation or after save)
  $effect(() => {
    form = { name: data.voice.name ?? '' }
    stationConfigs = buildStationConfigs()
    errors = {}
  })

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    e.stopPropagation()

    if (submitting) return
    if (stationConfigs.some(c => c.saving)) return

    const result = validateForm(voiceSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true

    try {
      await voicesApi.update(data.voice.id!, form)
      toast.success('Stem bijgewerkt')
      goto('/voices')
    } catch {
      toast.error('Bijwerken mislukt')
    } finally {
      submitting = false
    }
  }

  function updateConfig(index: number, updates: Partial<StationConfig>): void {
    stationConfigs = stationConfigs.map((config, i) =>
      i === index ? { ...config, ...updates } : config
    )
  }

  async function toggleStation(index: number, e?: Event): Promise<void> {
    e?.preventDefault()
    e?.stopPropagation()

    const config = stationConfigs[index]
    if (!config || config.saving || submitting) return

    const wasEnabled = config.enabled
    const stationVoiceId = config.stationVoiceId
    const stationId = config.station.id!
    const stationName = config.station.name

    updateConfig(index, { saving: true })

    try {
      if (wasEnabled && stationVoiceId) {
        await stationVoicesApi.delete(stationVoiceId)
        updateConfig(index, {
          enabled: false,
          stationVoiceId: null,
          mixPoint: 0,
          audioUrl: null,
          hasAudio: false,
          jingleFile: null,
          saving: false,
        })
        toast.success(`${stationName} ontkoppeld`)
      } else if (!wasEnabled) {
        const result = await stationVoicesApi.create({
          station_id: stationId,
          voice_id: data.voice.id!,
          mix_point: 0,
        })
        updateConfig(index, {
          enabled: true,
          stationVoiceId: result.id,
          saving: false,
        })
        toast.success(`${stationName} gekoppeld`)
      } else {
        updateConfig(index, { saving: false })
      }
    } catch {
      updateConfig(index, { saving: false })
      toast.error('Actie mislukt')
    }
  }

  function handleMixPointChange(index: number, value: number): void {
    updateConfig(index, { mixPoint: value })
  }

  async function saveMixPoint(index: number): Promise<void> {
    const config = stationConfigs[index]
    if (!config?.stationVoiceId) return

    try {
      await stationVoicesApi.update(config.stationVoiceId, {
        mix_point: config.mixPoint,
      })
    } catch {
      toast.error('Mix point opslaan mislukt')
    }
  }

  function handleJingleSelect(index: number, file: File): void {
    updateConfig(index, { jingleFile: file })
  }

  async function uploadJingle(index: number): Promise<void> {
    const config = stationConfigs[index]
    if (!config?.stationVoiceId || !config.jingleFile || config.saving) return

    const stationVoiceId = config.stationVoiceId
    const fileToUpload = config.jingleFile

    updateConfig(index, { saving: true })

    try {
      await stationVoicesApi.uploadJingle(stationVoiceId, fileToUpload)

      let audioUrl: string | null = null
      let hasAudio = false
      try {
        const updated = await stationVoicesApi.getById(stationVoiceId)
        hasAudio = !!updated.audio_file
        audioUrl = hasAudio ? (updated.audio_url ?? null) : null
      } catch {
        // Refresh failed, but upload succeeded — show success with stale audio state
      }

      updateConfig(index, {
        audioUrl,
        hasAudio,
        jingleFile: null,
        saving: false,
      })
      toast.success('Jingle geupload')
    } catch {
      updateConfig(index, { saving: false })
      toast.error('Jingle upload mislukt')
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Stem bewerken"
    subtitle={data.voice.name ?? ''}
  />

  <!-- Voice Name Form -->
  <div class="card bg-base-100">
    <div class="card-body">
      <h2 class="card-title">Algemeen</h2>
      <form
        onsubmit={handleSubmit}
        class="space-y-6"
      >
        <TextInput
          id="name"
          label="Naam"
          bind:value={form.name}
          error={errors.name}
          placeholder="Bijv. Dutch Male"
        />

        <div class="flex justify-end gap-2">
          <button
            type="submit"
            class="btn btn-primary"
            disabled={submitting}
          >
            {#if submitting}
              <span class="loading loading-sm loading-spinner"></span>
            {:else}
              <Check class="h-5 w-5" />
            {/if}
            Naam opslaan
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Station Configs -->
  <div class="card bg-base-100">
    <div class="card-body">
      <h2 class="card-title">Zenderconfiguratie</h2>
      <p class="page-subtitle mb-4">
        Koppel deze stem aan zenders en configureer de jingle instellingen.
      </p>

      <StationConfigDashboard
        configs={stationConfigs}
        disabled={submitting}
        onToggle={toggleStation}
        onMixPointChange={handleMixPointChange}
        onMixPointSave={saveMixPoint}
        onJingleSelect={handleJingleSelect}
        onJingleUpload={uploadJingle}
      />
    </div>
  </div>

  <!-- Actions -->
  <div class="flex gap-2">
    <a
      href="/voices"
      class="btn btn-ghost"
    >
      <X class="h-5 w-5" />
      Terug naar overzicht
    </a>
  </div>
</div>
