<script lang="ts">
  import FormField, { fieldA11y } from './FormField.svelte'

  interface Props {
    id: string
    label: string
    accept?: string
    error?: string
    hint?: string
    disabled?: boolean
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
</script>

<FormField
  {id}
  {label}
  {error}
  {hint}
>
  {#if existingAudioUrl}
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
    {...fieldA11y(id, error, hint)}
    type="file"
    {accept}
    onchange={e => onchange?.(e.currentTarget.files?.[0] ?? null)}
    class={['file-input w-full file-input-primary', error && 'file-input-error']}
    {disabled}
  />
</FormField>
