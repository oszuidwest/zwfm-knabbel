<script lang="ts">
  import { getMediaUrl } from '$lib/api/client'
  import { Radio, Upload, Music, Play, Pause } from '$lib/components/icons'
  import type { StationConfig } from '$lib/types'

  interface Props {
    configs: StationConfig[]
    disabled?: boolean
    onToggle: (index: number, e?: Event) => void
    onMixPointChange: (index: number, value: number) => void
    onMixPointSave: (index: number) => void
    onJingleSelect: (index: number, file: File) => void
    onJingleUpload: (index: number) => void
  }

  let {
    configs,
    disabled = false,
    onToggle,
    onMixPointChange,
    onMixPointSave,
    onJingleSelect,
    onJingleUpload,
  }: Props = $props()

  let dragOver = $state<number | null>(null)
  let playingIndex = $state<number | null>(null)
  let audioElements = $state<Record<number, HTMLAudioElement | null>>({})

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    dragOver = index
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    dragOver = null
  }

  function handleDrop(e: DragEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    dragOver = null

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('audio/')) {
        onJingleSelect(index, file)
      }
    }
  }

  function handleFileInput(e: Event, index: number) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      onJingleSelect(index, file)
    }
  }

  function togglePlayback(index: number) {
    const audio = audioElements[index]
    if (!audio) return

    if (playingIndex === index) {
      audio.pause()
      playingIndex = null
    } else {
      if (playingIndex !== null && audioElements[playingIndex]) {
        audioElements[playingIndex]?.pause()
      }
      audio.play()
      playingIndex = index
    }
  }

  function handleAudioEnded(index: number) {
    if (playingIndex === index) {
      playingIndex = null
    }
  }

  function getMixPointLabel(value: number): string {
    if (value === 0) return '0.0s'
    return `${value.toFixed(1)}s`
  }
</script>

{#if configs.length === 0}
  <div class="flex flex-col items-center justify-center gap-3 py-12 text-base-content/50">
    <Radio
      class="h-8 w-8"
      aria-hidden="true"
    />
    <p>Geen zenders beschikbaar</p>
  </div>
{:else}
  <div class="space-y-4">
    {#each configs as config, index (config.station.id)}
      <div
        class="card border shadow-sm {config.enabled
          ? 'border-primary/20 bg-base-100'
          : 'border-base-300 bg-base-100 opacity-60'}"
        class:pointer-events-none={config.saving}
      >
        <div class="card-body space-y-5 p-5">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl {config.enabled
                  ? 'bg-primary/10'
                  : 'bg-base-content/5'}"
              >
                <Radio
                  class="h-5 w-5 {config.enabled ? 'text-primary' : 'text-base-content/30'}"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 class="font-semibold">{config.station.name}</h3>
                {#if config.enabled}
                  <span class="flex items-center gap-1 text-xs text-success">
                    <span class="h-1.5 w-1.5 rounded-full bg-success"></span>
                    Gekoppeld
                  </span>
                {:else}
                  <span class="text-xs text-base-content/40">Niet gekoppeld</span>
                {/if}
              </div>
            </div>
            <div class="flex items-center gap-2">
              {#if config.saving}
                <span class="loading loading-sm loading-spinner"></span>
              {/if}
              <input
                type="checkbox"
                class="toggle toggle-primary"
                checked={config.enabled}
                onchange={e => onToggle(index, e)}
                disabled={disabled || config.saving}
              />
            </div>
          </div>

          {#if config.enabled}
            <!-- Mixpunt -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label
                  class="text-sm font-medium"
                  for="mixpoint-{config.station.id}"
                >
                  Mixpunt
                </label>
                <span class="rounded bg-base-200 px-2 py-0.5 text-sm font-semibold tabular-nums">
                  {getMixPointLabel(config.mixPoint)}
                </span>
              </div>
              <input
                id="mixpoint-{config.station.id}"
                type="range"
                class="range w-full range-primary range-sm"
                min="0"
                max="20"
                step="0.5"
                value={config.mixPoint}
                oninput={e =>
                  onMixPointChange(index, parseFloat((e.target as HTMLInputElement).value))}
                onchange={() => onMixPointSave(index)}
                disabled={disabled || config.saving}
              />
              <p class="text-xs text-base-content/50">Wanneer de stem begint over de jingle</p>
            </div>

            <!-- Jingle -->
            <div class="space-y-3">
              <span class="text-sm font-medium">Jingle</span>

              {#if config.hasAudio && config.audioUrl}
                <!-- Audio player -->
                <div class="flex items-center gap-3 rounded-xl bg-base-200 p-3">
                  <audio
                    bind:this={audioElements[index]}
                    src={getMediaUrl(config.audioUrl)}
                    onended={() => handleAudioEnded(index)}
                    preload="none"
                    class="hidden"
                  ></audio>
                  <button
                    type="button"
                    class="btn btn-circle btn-sm btn-primary"
                    onclick={() => togglePlayback(index)}
                    disabled={config.saving}
                    aria-label={playingIndex === index ? 'Pauzeren' : 'Afspelen'}
                  >
                    {#if playingIndex === index}
                      <Pause
                        class="h-4 w-4"
                        aria-hidden="true"
                      />
                    {:else}
                      <Play
                        class="h-4 w-4"
                        aria-hidden="true"
                      />
                    {/if}
                  </button>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-medium">Jingle geladen</div>
                    <div class="text-xs text-base-content/50">Klik om af te spelen</div>
                  </div>
                  <label
                    for="jingle-replace-{config.station.id}"
                    class="btn cursor-pointer btn-ghost btn-sm"
                  >
                    Vervang
                  </label>
                  <input
                    id="jingle-replace-{config.station.id}"
                    type="file"
                    accept="audio/wav,audio/*"
                    onchange={e => handleFileInput(e, index)}
                    disabled={config.saving}
                    class="hidden"
                  />
                </div>
              {/if}

              {#if config.jingleFile}
                <!-- File selected, waiting for upload -->
                <div
                  class="flex items-center gap-3 rounded-xl border-2 border-warning bg-warning/10 p-3"
                >
                  <Music
                    class="h-5 w-5 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  <span class="min-w-0 flex-1 truncate text-sm font-medium">
                    {config.jingleFile.name}
                  </span>
                  <button
                    type="button"
                    class="btn btn-sm btn-warning"
                    onclick={() => onJingleUpload(index)}
                    disabled={config.saving}
                  >
                    {#if config.saving}
                      <span class="loading loading-xs loading-spinner"></span>
                    {:else}
                      <Upload
                        class="h-4 w-4"
                        aria-hidden="true"
                      />
                    {/if}
                    Upload
                  </button>
                </div>
              {:else if !config.hasAudio}
                <!-- Dropzone -->
                <div
                  class="cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors {dragOver ===
                  index
                    ? 'border-primary bg-primary/10'
                    : 'border-base-content/20 hover:border-primary hover:bg-primary/5'}"
                  role="button"
                  tabindex="0"
                  ondragover={e => handleDragOver(e, index)}
                  ondragleave={handleDragLeave}
                  ondrop={e => handleDrop(e, index)}
                  onkeydown={e =>
                    e.key === 'Enter' &&
                    document.getElementById(`jingle-input-${config.station.id}`)?.click()}
                  onclick={() =>
                    document.getElementById(`jingle-input-${config.station.id}`)?.click()}
                >
                  <input
                    id="jingle-input-{config.station.id}"
                    type="file"
                    accept="audio/wav,audio/*"
                    onchange={e => handleFileInput(e, index)}
                    disabled={config.saving}
                    class="hidden"
                  />
                  <Upload
                    class="mx-auto mb-2 h-8 w-8 text-base-content/30"
                    aria-hidden="true"
                  />
                  <p class="text-sm text-base-content/50">
                    Sleep een audiobestand of klik om te selecteren
                  </p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
