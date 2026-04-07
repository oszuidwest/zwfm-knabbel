<script lang="ts">
  import FormField from './FormField.svelte'

  interface Props {
    id: string
    label: string
    accept?: string
    error?: string
    hint?: string
    disabled?: boolean
    /** URL of existing audio file - shows player when provided and no new file selected */
    existingAudioUrl?: string
    onchange?: (file: File | null) => void
  }

  let {
    id,
    label,
    accept,
    error,
    hint,
    disabled = false,
    existingAudioUrl,
    onchange,
  }: Props = $props()

  function handleChange(e: Event): void {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    onchange?.(file)
  }

  // Show existing audio when URL provided and no new file selected (hint contains filename)
  const showExistingAudio = $derived(existingAudioUrl && !hint)
</script>

<FormField
  {id}
  {label}
  {error}
  {hint}
>
  {#if showExistingAudio}
    <audio
      controls
      src={existingAudioUrl}
      class="mb-2 w-full"
    >
      Je browser ondersteunt geen audio weergave.
    </audio>
    <p class="mb-2 text-sm text-base-content/60">Upload een nieuw bestand om te vervangen:</p>
  {/if}
  <input
    {id}
    type="file"
    {accept}
    onchange={handleChange}
    class="file-input-bordered file-input w-full file-input-primary"
    class:file-input-error={error}
    {disabled}
  />
</FormField>
