<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { ApiError, notifyMutationError } from '$lib/api/client'
  import { settingsApi } from '$lib/api/settings'
  import {
    textNormalizationOptions,
    toTTSSettingsFormData,
    toTTSSettingsUpdate,
    ttsModelOptions,
    ttsSettingsSchema,
    type TTSSettingsFormData,
  } from '$lib/schemas/tts-settings'
  import { Check, RefreshCw, Sparkles } from '$lib/components/icons'
  import { toast } from '$lib/stores/toast'
  import { formatDateTime } from '$lib/utils/format'
  import { validateForm } from '$lib/utils/validation'
  import { MaybeTooltip, SelectInput, TextareaInput, TextInput } from '$lib/components/ui'
  import type { components, TTSSettings } from '$lib/types'

  type NumericSettingField = 'stability' | 'similarity_boost' | 'style' | 'speed'

  interface Props {
    settings: TTSSettings
    canEdit: boolean
  }

  type ValidationErrorDetails = components['schemas']['ValidationError']

  let { settings, canEdit }: Props = $props()

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

  // Svelte warns when prop values are captured directly into state initializers.
  // This lazy reader makes the keyed component's one-time form initialization explicit.
  function initialForm(): TTSSettingsFormData {
    return toTTSSettingsFormData(settings)
  }

  let savedForm = $state<TTSSettingsFormData>(initialForm())
  let form = $state<TTSSettingsFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  const isDirty = $derived(JSON.stringify(form) !== JSON.stringify(savedForm))
  const isV3Model = $derived(form.model === 'eleven_v3')
  const reloadLabel = $derived(isDirty ? 'Wijzigingen verwerpen' : 'Herladen')
  const formDisabled = $derived(submitting || !canEdit)

  function isValidationErrorDetails(value: unknown): value is ValidationErrorDetails {
    return typeof value === 'object' && value !== null && 'errors' in value
  }

  function validationErrorsFromDetails(details: unknown): Record<string, string> {
    if (!isValidationErrorDetails(details) || !Array.isArray(details.errors)) return {}

    return details.errors.reduce<Record<string, string>>((result, error) => {
      if (error.field && error.message && !result[error.field]) {
        result[error.field] = error.message
      }
      return result
    }, {})
  }

  async function reloadSettings(): Promise<void> {
    if (isDirty && !confirm('Onopgeslagen wijzigingen verwerpen en opnieuw laden?')) return

    if (isDirty) {
      form = { ...savedForm }
      errors = {}
    }

    await invalidateAll()
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

    if (submitting || !canEdit) return

    const result = validateForm(ttsSettingsSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      try {
        await settingsApi.updateTts(toTTSSettingsUpdate(result.data))
      } catch (err) {
        if (err instanceof ApiError && err.status === 422) {
          const validationErrors = validationErrorsFromDetails(err.details)
          if (Object.keys(validationErrors).length > 0) {
            errors = validationErrors
            toast.error('Controleer de velden')
            return
          }
        }

        notifyMutationError(err, 'Opslaan mislukt')
        return
      }

      toast.success('Spraakmodel opgeslagen')
      await invalidateAll()
    } finally {
      submitting = false
    }
  }

  function handleNumberInput(field: NumericSettingField, e: Event): void {
    const input = e.target as HTMLInputElement
    if (input.value === '') return

    const value = Number(input.value)
    if (!Number.isNaN(value)) {
      form = { ...form, [field]: value }
    }
  }
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
  <div class="rounded-lg border border-base-300 bg-base-100 p-4">
    <div class="text-xs font-medium tracking-wide text-base-content/60 uppercase">API-sleutel</div>
    <div class="mt-2">
      <span class={['badge', settings.api_key_configured ? 'badge-success' : 'badge-warning']}>
        {settings.api_key_configured ? 'Geconfigureerd' : 'Ontbreekt'}
      </span>
    </div>
  </div>
  <div class="rounded-lg border border-base-300 bg-base-100 p-4">
    <div class="text-xs font-medium tracking-wide text-base-content/60 uppercase">Model</div>
    <div class="mt-2 font-semibold">{settings.model}</div>
  </div>
  <div class="rounded-lg border border-base-300 bg-base-100 p-4">
    <div class="text-xs font-medium tracking-wide text-base-content/60 uppercase">Bijgewerkt</div>
    <div class="mt-2 font-semibold">{formatDateTime(settings.updated_at)}</div>
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
        options={ttsModelOptions}
        error={errors.model}
        disabled={formDisabled}
      />

      <SelectInput
        id="apply_text_normalization"
        label="Tekstnormalisatie"
        bind:value={form.apply_text_normalization}
        options={textNormalizationOptions}
        error={errors.apply_text_normalization}
        disabled={formDisabled}
      />
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {#each numericSettings as setting (setting.field)}
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <label
              class="font-medium"
              for="{setting.field}_number"
            >
              {setting.label}
            </label>
            <input
              id="{setting.field}_number"
              type="number"
              class={['input w-24 input-sm tabular-nums', errors[setting.field] && 'input-error']}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={form[setting.field]}
              oninput={e => handleNumberInput(setting.field, e)}
              disabled={formDisabled}
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
            disabled={formDisabled}
            aria-label="{setting.label} slider"
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
        disabled={formDisabled}
      />

      <fieldset class="fieldset">
        <label
          class="fieldset-legend"
          for="use_speaker_boost"
        >
          Speaker boost
        </label>
        <input
          id="use_speaker_boost"
          type="checkbox"
          class="toggle toggle-primary"
          bind:checked={form.use_speaker_boost}
          disabled={formDisabled}
        />
      </fieldset>
    </div>

    <TextareaInput
      id="tts_style_prefix"
      label="Eleven v3 stijlprefix"
      bind:value={form.tts_style_prefix}
      error={errors.tts_style_prefix}
      hint={isV3Model
        ? 'Alleen toegepast bij model Eleven v3'
        : 'Niet beschikbaar voor het huidige model'}
      rows={3}
      placeholder="[nieuwslezer] "
      disabled={formDisabled || !isV3Model}
    />

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="btn btn-ghost"
        onclick={reloadSettings}
        disabled={submitting}
      >
        <RefreshCw class="h-5 w-5" />
        {reloadLabel}
      </button>
      <MaybeTooltip
        when={!canEdit}
        tip="Geen rechten"
        placement="tooltip-left"
      >
        <button
          type="submit"
          class="btn btn-primary"
          disabled={formDisabled || !isDirty}
        >
          {#if submitting}
            <span class="loading loading-sm loading-spinner"></span>
          {:else}
            <Check class="h-5 w-5" />
          {/if}
          Opslaan
        </button>
      </MaybeTooltip>
    </div>
  </div>
</form>
