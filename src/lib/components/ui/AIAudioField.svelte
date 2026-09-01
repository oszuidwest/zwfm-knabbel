<script lang="ts">
  import { Sparkles } from '$lib/components/icons'

  interface Props {
    voiceName: string
    mode: 'create' | 'edit'
    generating: boolean
    disabled?: boolean
    audioUrl?: string
    ongenerate: () => void
  }

  let { voiceName, mode, generating, disabled = false, audioUrl, ongenerate }: Props = $props()

  const hint = $derived(
    mode === 'create'
      ? 'Het bericht wordt eerst opgeslagen.'
      : 'Wijzigingen worden eerst opgeslagen.'
  )
  const actionLabel = $derived(
    mode === 'create'
      ? 'Aanmaken en audio genereren'
      : audioUrl
        ? 'Audio opnieuw genereren'
        : 'Audio genereren'
  )
</script>

<fieldset class="fieldset">
  <legend class="fieldset-legend text-base font-medium">Audiobestand</legend>

  {#if audioUrl}
    <audio
      controls
      preload="metadata"
      src={audioUrl}
      class="mb-2 w-full"
      aria-label="Audio gegenereerd met {voiceName}"
    >
      Je browser ondersteunt geen audio weergave.
    </audio>
  {/if}

  <button
    type="button"
    class="btn w-fit self-start btn-outline"
    onclick={ongenerate}
    {disabled}
  >
    {#if generating}
      <span class="loading loading-sm loading-spinner"></span>
      Genereren…
    {:else}
      <Sparkles
        aria-hidden="true"
        class="h-5 w-5"
      />
      {actionLabel}
    {/if}
  </button>

  <p class="fieldset-label text-sm leading-relaxed text-base-content/70">{hint}</p>
</fieldset>
