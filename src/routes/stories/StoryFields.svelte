<script lang="ts">
  import type { StoryFormData } from '#lib/schemas/story.js'
  import { toSelectOptions } from '#lib/utils/form.js'
  import { noVoiceUploadHint, statusOptions } from '#lib/utils/labels.js'
  import {
    AIAudioField,
    BreakingToggle,
    TextInput,
    TextareaInput,
    SelectInput,
    FileInput,
    FormField,
    fieldA11y,
    WeekdayCheckboxGroup,
  } from '#lib/components/ui/index.js'
  import type { Voice } from '#lib/types/index.js'

  interface Props {
    form: StoryFormData
    audioFile: File | null
    errors: Record<string, string>
    voices: Voice[]
    selectedVoice: Voice | undefined
    mode: 'create' | 'edit'
    generating: boolean
    disabled: boolean
    /** The saved audio of the story being edited. */
    audioUrl?: string
    ongenerate: () => void
  }

  let {
    form = $bindable(),
    audioFile = $bindable(),
    errors,
    voices,
    selectedVoice,
    mode,
    generating,
    disabled,
    audioUrl,
    ongenerate,
  }: Props = $props()

  const voiceOptions = $derived(toSelectOptions(voices))

  function setVoiceId(value: string | null | undefined): void {
    form.voice_id = value ?? ''
    if (!form.voice_id || selectedVoice?.elevenlabs_voice_id) audioFile = null
  }
</script>

<TextInput
  id="title"
  label="Titel"
  bind:value={form.title}
  error={errors.title}
  placeholder="Titel van het bericht"
  {disabled}
/>

<TextareaInput
  id="text"
  label="Tekst"
  bind:value={form.text}
  error={errors.text}
  placeholder="De tekst die wordt voorgelezen"
  rows={8}
  {disabled}
/>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <SelectInput
    id="voice_id"
    label="Stem"
    bind:value={() => form.voice_id, setVoiceId}
    options={voiceOptions}
    error={errors.voice_id}
    emptyOption="Geen stem geselecteerd"
    {disabled}
  />

  <FormField
    id="status"
    label="Status"
    error={errors.status}
  >
    <div class="join w-full">
      <select
        id="status"
        {...fieldA11y('status', errors.status)}
        class={['select join-item flex-1', errors.status && 'select-error']}
        bind:value={form.status}
        {disabled}
      >
        {#each statusOptions as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      <BreakingToggle
        bind:checked={form.is_breaking}
        {disabled}
      />
    </div>
  </FormField>
</div>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <TextInput
    id="start_date"
    label="Startdatum"
    type="date"
    bind:value={form.start_date}
    error={errors.start_date}
    {disabled}
  />

  <TextInput
    id="end_date"
    label="Einddatum"
    type="date"
    bind:value={form.end_date}
    error={errors.end_date}
    {disabled}
  />
</div>

<WeekdayCheckboxGroup
  bind:value={form.weekdays}
  {disabled}
/>

{#if selectedVoice?.elevenlabs_voice_id}
  <AIAudioField
    voiceName={selectedVoice.name}
    {mode}
    {generating}
    {disabled}
    {audioUrl}
    {ongenerate}
  />
{:else}
  <!-- Remounting on a cleared voice also empties the native file input. -->
  {#key !form.voice_id}
    <FileInput
      id="audio"
      label={mode === 'create' ? 'Audiobestand (optioneel)' : 'Audiobestand'}
      accept="audio/wav,audio/*"
      existingAudioUrl={audioFile ? undefined : audioUrl}
      error={mode === 'edit' ? errors.audio : undefined}
      hint={form.voice_id ? audioFile?.name : noVoiceUploadHint}
      onchange={file => (audioFile = file)}
      disabled={disabled || !form.voice_id}
    />
  {/key}
{/if}
