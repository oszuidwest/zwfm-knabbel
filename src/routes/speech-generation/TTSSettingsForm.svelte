<script lang="ts">
  import { refreshAll } from '$app/navigation'
  import { getFieldErrors, notifyMutationError } from '#lib/api/client.js'
  import { patchSettingsTts } from '#lib/api/generated/sdk.gen.js'
  import {
    textNormalizationOptions,
    toTTSSettingsFormData,
    toTTSSettingsUpdate,
    ttsSettingsSchema,
    type TTSSettingsFormData,
  } from '#lib/schemas/tts-settings.js'
  import { Check, RefreshCw } from '#lib/components/icons.js'
  import { toast } from '#lib/stores/toast.js'
  import { validateForm } from '#lib/utils/validation.js'
  import { MaybeTooltip, SelectInput, TextareaInput, TextInput } from '#lib/components/ui/index.js'
  import type { TTSSettings } from '#lib/types/index.js'

  interface Props {
    settings: TTSSettings
    canEdit: boolean
  }

  let { settings, canEdit }: Props = $props()

  const stabilityHint =
    'Hoger klinkt consistenter en voorspelbaarder, lager geeft meer expressie en variatie.'
  const textNormalizationHint =
    'Maakt cijfers, symbolen en afkortingen beter uitspreekbaar. Auto laat ElevenLabs kiezen.'
  const seedHint =
    'Leeg is willekeurig. Een vaste seed helpt herhalen, maar garandeert geen gelijke audio.'
  const stylePrefixHint = 'Vaste audiotags voor elke story, bijvoorbeeld [calm] of [whispers].'

  // The keyed parent remounts this form when settings change.
  function initialForm(): TTSSettingsFormData {
    return toTTSSettingsFormData(settings)
  }

  let savedForm = $state<TTSSettingsFormData>(initialForm())
  let form = $state<TTSSettingsFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  const isDirty = $derived(JSON.stringify(form) !== JSON.stringify(savedForm))
  const reloadLabel = $derived(isDirty ? 'Wijzigingen verwerpen' : 'Herladen')
  const formDisabled = $derived(submitting || !canEdit)

  async function reloadSettings(): Promise<void> {
    if (isDirty && !confirm('Onopgeslagen wijzigingen verwerpen en opnieuw laden?')) return

    if (isDirty) {
      form = { ...savedForm }
      errors = {}
    }

    await refreshAll()
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
        await patchSettingsTts({ body: toTTSSettingsUpdate(result.data) })
      } catch (err) {
        errors = getFieldErrors(err)
        notifyMutationError(err, 'Opslaan mislukt')
        return
      }

      toast.success('Spraakgeneratie opgeslagen')
      await refreshAll()
    } finally {
      submitting = false
    }
  }

  // Keep the last valid value while the number box is empty or mid-edit.
  function handleStabilityInput(e: Event & { currentTarget: HTMLInputElement }): void {
    const value = e.currentTarget.valueAsNumber
    if (!Number.isNaN(value)) form.stability = value
  }
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  <div class="rounded-lg border border-base-300 bg-base-100 p-4">
    <div class="text-sm text-base-content/60">API-sleutel</div>
    <div class="mt-2">
      <span
        class={['badge badge-soft', settings.api_key_configured ? 'badge-success' : 'badge-error']}
      >
        {settings.api_key_configured ? 'Geconfigureerd' : 'Ontbreekt'}
      </span>
    </div>
  </div>
  <div class="rounded-lg border border-base-300 bg-base-100 p-4">
    <div class="text-sm text-base-content/60">Model</div>
    <div class="mt-2 font-mono">{settings.model_id}</div>
  </div>
</div>

<form
  onsubmit={handleSubmit}
  class="card bg-base-100"
>
  <div class="card-body space-y-6">
    <h2 class="card-title">Spraakgeneratie</h2>
    <p class="max-w-3xl text-sm leading-relaxed text-base-content/70">
      Babbel stuurt alleen stabiliteit als steminstelling mee. Tekstnormalisatie, seed en audiotags
      sturen de generatie daarnaast; audio kan per generatie licht variëren.
    </p>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SelectInput
        id="apply_text_normalization"
        label="Tekstnormalisatie"
        bind:value={form.apply_text_normalization}
        options={textNormalizationOptions}
        error={errors.apply_text_normalization}
        hint={textNormalizationHint}
        disabled={formDisabled}
      />
      <TextInput
        id="seed"
        label="Seed"
        bind:value={form.seed}
        error={errors.seed}
        hint={seedHint}
        placeholder="Leeg voor willekeurig"
        disabled={formDisabled}
      />
    </div>

    <div class="max-w-2xl space-y-4">
      <div class="flex items-center justify-between gap-4">
        <label
          class="font-medium"
          for="stability_number"
        >
          Stabiliteit
        </label>
        <input
          id="stability_number"
          type="number"
          class={['input w-24 tabular-nums input-sm', errors.stability && 'input-error']}
          min={0}
          max={1}
          step={0.01}
          value={form.stability}
          oninput={handleStabilityInput}
          disabled={formDisabled}
        />
      </div>
      <input
        id="stability"
        type="range"
        class="range w-full range-primary range-sm"
        min={0}
        max={1}
        step={0.01}
        value={form.stability}
        oninput={handleStabilityInput}
        disabled={formDisabled}
        aria-label="Stabiliteit"
      />
      {#if errors.stability}
        <p class="fieldset-label text-sm leading-relaxed text-error">{errors.stability}</p>
      {:else}
        <p class="fieldset-label text-sm leading-relaxed text-base-content/70">{stabilityHint}</p>
      {/if}
    </div>

    <TextareaInput
      id="tts_style_prefix"
      label="Audiotags"
      bind:value={form.tts_style_prefix}
      error={errors.tts_style_prefix}
      hint={stylePrefixHint}
      rows={3}
      placeholder="[calm] "
      disabled={formDisabled}
    />

    <div class="flex flex-wrap justify-end gap-2 pt-2">
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
