<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { settingsApi } from '$lib/api/settings'
  import {
    textNormalizationOptions,
    toTTSSettingsFormData,
    toTTSSettingsUpdate,
    ttsModelOptions,
    ttsSettingsSchema,
    type TTSSettingsFormData,
  } from '$lib/schemas/tts-settings'
  import { Check, RefreshCw, Sparkles, TriangleAlert } from '$lib/components/icons'
  import { toast } from '$lib/stores/toast'
  import { formatDateTime } from '$lib/utils/format'
  import { validateForm } from '$lib/utils/validation'
  import { PageHeader, SelectInput, TextareaInput, TextInput } from '$lib/components/ui'
  import type { TTSSettings } from '$lib/types'
  import type { PageData } from './$types'

  type NumericSettingField = 'stability' | 'similarity_boost' | 'style' | 'speed'

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()

  const numericSettings: {
    field: NumericSettingField
    label: string
    min: number
    max: number
    step: number
  }[] = [
    { field: 'stability', label: 'Stabiliteit', min: 0, max: 1, step: 0.01 },
    { field: 'similarity_boost', label: 'Similarity boost', min: 0, max: 1, step: 0.01 },
    { field: 'style', label: 'Stijl', min: 0, max: 1, step: 0.01 },
    { field: 'speed', label: 'Snelheid', min: 0.7, max: 1.2, step: 0.01 },
  ]

  function initialForm(settings: TTSSettings | null): TTSSettingsFormData {
    if (settings) return toTTSSettingsFormData(settings)

    return {
      model: 'eleven_v3',
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0,
      use_speaker_boost: true,
      speed: 1,
      apply_text_normalization: 'auto',
      seed: '',
      tts_style_prefix: '',
    }
  }

  let form = $state<TTSSettingsFormData>(initialForm(null))
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let savedSettings = $state<TTSSettings | null>(null)
  let loadedSettingsVersion = $state<string | null>(null)

  const canEdit = $derived(!!savedSettings && !data.loadError)

  $effect(() => {
    const settings = data.settings
    if (settings && settings.updated_at !== loadedSettingsVersion) {
      savedSettings = settings
      form = toTTSSettingsFormData(settings)
      loadedSettingsVersion = settings.updated_at
    } else if (data.loadError) {
      savedSettings = null
      loadedSettingsVersion = null
    }
  })

  async function reloadSettings(): Promise<void> {
    await invalidateAll()
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

    if (!canEdit || submitting) return

    const result = validateForm(ttsSettingsSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      const updated = await settingsApi.updateTts(toTTSSettingsUpdate(result.data))
      savedSettings = updated
      form = toTTSSettingsFormData(updated)
      toast.success('AI-instellingen opgeslagen')
    } catch {
      toast.error('Opslaan mislukt')
    } finally {
      submitting = false
    }
  }

  function handleNumberInput(field: NumericSettingField, e: Event): void {
    const value = Number((e.target as HTMLInputElement).value)
    if (!Number.isNaN(value)) {
      form = { ...form, [field]: value }
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="AI-instellingen"
    subtitle="Globale ElevenLabs instellingen voor tekst-naar-spraak"
  />

  {#if data.loadError}
    <div class="alert border-warning/30 bg-warning/10 text-warning-content">
      <TriangleAlert
        class="h-5 w-5"
        aria-hidden="true"
      />
      <div>
        <h2 class="font-semibold">AI-instellingen niet beschikbaar</h2>
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
        onclick={reloadSettings}
      >
        <RefreshCw class="h-4 w-4" />
        Opnieuw laden
      </button>
    </div>
  {:else if savedSettings}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-lg border border-base-300 bg-base-100 p-4">
        <div class="text-xs font-medium tracking-wide text-base-content/60 uppercase">
          API-sleutel
        </div>
        <div class="mt-2">
          <span
            class={['badge', savedSettings.api_key_configured ? 'badge-success' : 'badge-warning']}
          >
            {savedSettings.api_key_configured ? 'Geconfigureerd' : 'Ontbreekt'}
          </span>
        </div>
      </div>
      <div class="rounded-lg border border-base-300 bg-base-100 p-4">
        <div class="text-xs font-medium tracking-wide text-base-content/60 uppercase">Model</div>
        <div class="mt-2 font-semibold">{savedSettings.model}</div>
      </div>
      <div class="rounded-lg border border-base-300 bg-base-100 p-4">
        <div class="text-xs font-medium tracking-wide text-base-content/60 uppercase">
          Bijgewerkt
        </div>
        <div class="mt-2 font-semibold">{formatDateTime(savedSettings.updated_at)}</div>
      </div>
    </div>

    <form
      onsubmit={handleSubmit}
      class="card bg-base-100"
    >
      <div class="card-body space-y-6">
        <div class="flex items-center gap-3">
          <Sparkles
            class="h-5 w-5 text-primary"
            aria-hidden="true"
          />
          <h2 class="card-title">Tekst-naar-spraak</h2>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectInput
            id="model"
            label="Model"
            bind:value={form.model}
            options={[...ttsModelOptions]}
            error={errors.model}
            disabled={submitting}
          />

          <SelectInput
            id="apply_text_normalization"
            label="Tekstnormalisatie"
            bind:value={form.apply_text_normalization}
            options={[...textNormalizationOptions]}
            error={errors.apply_text_normalization}
            disabled={submitting}
          />
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {#each numericSettings as setting (setting.field)}
            <div class="space-y-4">
              <div class="flex items-center justify-between gap-4">
                <label
                  class="font-medium"
                  for={setting.field}
                >
                  {setting.label}
                </label>
                <input
                  id="{setting.field}_number"
                  type="number"
                  class={[
                    'input w-24 input-sm tabular-nums',
                    errors[setting.field] && 'input-error',
                  ]}
                  min={setting.min}
                  max={setting.max}
                  step={setting.step}
                  value={form[setting.field]}
                  oninput={e => handleNumberInput(setting.field, e)}
                  disabled={submitting}
                  aria-label="{setting.label} waarde"
                />
              </div>
              <input
                id={setting.field}
                type="range"
                class="range w-full range-primary range-sm"
                min={setting.min}
                max={setting.max}
                step={setting.step}
                value={form[setting.field]}
                oninput={e => handleNumberInput(setting.field, e)}
                disabled={submitting}
              />
              {#if errors[setting.field]}
                <p class="label text-error">{errors[setting.field]}</p>
              {/if}
            </div>
          {/each}
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="seed"
            label="Seed"
            bind:value={form.seed}
            error={errors.seed}
            placeholder="Leeg voor willekeurig"
            disabled={submitting}
          />

          <label class="fieldset">
            <span class="fieldset-legend">Speaker boost</span>
            <input
              type="checkbox"
              class="toggle toggle-primary"
              bind:checked={form.use_speaker_boost}
              disabled={submitting}
            />
          </label>
        </div>

        <TextareaInput
          id="tts_style_prefix"
          label="Eleven v3 stijlprefix"
          bind:value={form.tts_style_prefix}
          error={errors.tts_style_prefix}
          rows={3}
          placeholder="[nieuwslezer] "
          disabled={submitting}
        />

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="btn btn-ghost"
            onclick={reloadSettings}
            disabled={submitting}
          >
            <RefreshCw class="h-5 w-5" />
            Herladen
          </button>
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
            Opslaan
          </button>
        </div>
      </div>
    </form>
  {/if}
</div>
