<script lang="ts">
  import { goto } from '$app/navigation'
  import { voiceSchema, type VoiceFormData } from '$lib/schemas/voice'
  import { voicesApi } from '$lib/api/voices'
  import { stationVoicesApi } from '$lib/api/station-voices'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { resolveInternalHref } from '$lib/utils/routes'
  import { TextInput, PageHeader } from '$lib/components/ui'
  import StationConfigDashboard from './StationConfigDashboard.svelte'
  import { X, Check } from '$lib/components/icons'
  import type { StationVoice } from '$lib/types'
  import type { StationConfig } from './station-config'
  import type { PageData } from './$types'

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()

  function initialForm(): VoiceFormData {
    return { name: data.voice.name ?? '' }
  }

  function initialStationConfigs(): StationConfig[] {
    return buildStationConfigs(data)
  }

  let form = $state<VoiceFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let stationConfigs = $state<StationConfig[]>(initialStationConfigs())

  function buildStationConfigs(pageData: PageData): StationConfig[] {
    const stationVoicesByStationId = pageData.stationVoices.reduce<Record<number, StationVoice>>(
      (result, stationVoice) => {
        if (stationVoice.station_id) {
          result[stationVoice.station_id] = stationVoice
        }
        return result
      },
      {}
    )

    return pageData.stations.map(station => {
      const sv = stationVoicesByStationId[station.id!]
      const mixPoint = sv?.mix_point ?? 0
      const hasAudio = !!sv?.audio_file

      return {
        station,
        enabled: !!sv,
        stationVoiceId: sv?.id ?? null,
        mixPoint,
        savedMixPoint: mixPoint,
        audioUrl: hasAudio ? (sv?.audio_url ?? null) : null,
        hasAudio,
        jingleFile: null,
        saving: false,
      }
    })
  }

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
      goto(resolveInternalHref('/voices'))
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
          savedMixPoint: 0,
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
          mixPoint: 0,
          savedMixPoint: 0,
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
    if (!config?.stationVoiceId || config.saving || config.mixPoint === config.savedMixPoint) return

    const mixPoint = config.mixPoint
    updateConfig(index, { saving: true })

    try {
      await stationVoicesApi.update(config.stationVoiceId, {
        mix_point: mixPoint,
      })
      updateConfig(index, { savedMixPoint: mixPoint, saving: false })
    } catch {
      updateConfig(index, { saving: false })
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

  <div class="flex gap-2">
    <a
      href={resolveInternalHref('/voices')}
      class="btn btn-ghost"
    >
      <X class="h-5 w-5" />
      Terug naar overzicht
    </a>
  </div>
</div>
