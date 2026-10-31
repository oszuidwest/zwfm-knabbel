<script lang="ts">
  import { Pause, Play } from '$lib/components/icons'
  import { formatDuration } from '$lib/utils/format'

  interface Props {
    src: string | undefined
    /** Known length in seconds, shown until the browser has read the file. */
    duration?: number | null
    label: string
    /** `md` for a page's main audio, `sm` inside cards and rows, `icon` in table cells. */
    size?: 'md' | 'sm' | 'icon'
    disabled?: boolean
  }

  let { src, duration = null, label, size = 'md', disabled = false }: Props = $props()

  let audio = $state<HTMLAudioElement | null>(null)
  let paused = $state(true)
  let currentTime = $state(0)
  let mediaDuration = $state(0)
  let failed = $state(false)

  const total = $derived(mediaDuration || duration || 0)
  const unavailable = $derived(failed || !src)

  // One clip at a time: starting any other media on the page pauses this one.
  $effect(() => {
    function handlePlay(e: Event): void {
      if (audio && e.target !== audio) audio.pause()
    }
    document.addEventListener('play', handlePlay, true)
    return () => document.removeEventListener('play', handlePlay, true)
  })

  function toggle(): void {
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => (failed = true))
    } else {
      audio.pause()
    }
  }

  function seek(e: Event & { currentTarget: HTMLInputElement }): void {
    if (audio) audio.currentTime = e.currentTarget.valueAsNumber
  }
</script>

{#snippet playButton()}
  <button
    type="button"
    class={[
      'btn btn-circle shrink-0 btn-primary',
      size === 'sm' && 'btn-sm',
      size === 'icon' && ['btn-sm', paused && 'btn-soft'],
    ]}
    onclick={toggle}
    disabled={disabled || unavailable}
    aria-label={paused ? `${label} afspelen` : `${label} pauzeren`}
    title={size === 'icon' && unavailable ? 'Audio niet beschikbaar' : undefined}
  >
    {#if paused}
      <Play
        aria-hidden="true"
        class={['ml-0.5 fill-current', size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5']}
      />
    {:else}
      <Pause
        aria-hidden="true"
        class={['fill-current', size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5']}
      />
    {/if}
  </button>
{/snippet}

<audio
  bind:this={audio}
  bind:paused
  bind:currentTime
  {src}
  preload={size === 'icon' ? 'none' : 'metadata'}
  onloadedmetadata={() => {
    if (audio && Number.isFinite(audio.duration)) mediaDuration = audio.duration
  }}
  onerror={() => (failed = true)}
></audio>

{#if size === 'icon'}
  {@render playButton()}
{:else}
  <div
    class={[
      'flex items-center bg-base-200',
      size === 'md' ? 'gap-3 rounded-xl p-2 pr-4' : 'gap-2 rounded-lg p-1 pr-3',
    ]}
  >
    {@render playButton()}
    {#if unavailable}
      <span class="text-sm text-base-content/60">Audio niet beschikbaar</span>
    {:else}
      <input
        type="range"
        class="range min-w-0 flex-1 range-primary range-xs"
        min="0"
        max={total || 1}
        step="0.1"
        value={currentTime}
        oninput={seek}
        disabled={disabled || !total}
        aria-label="Positie in {label}"
      />
      <span class="shrink-0 text-xs text-base-content/60 tabular-nums">
        {formatDuration(currentTime)} / {formatDuration(total)}
      </span>
    {/if}
  </div>
{/if}
