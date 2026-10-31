<script lang="ts">
  import { X, TriangleAlert } from './icons'
  import { showModal } from '$lib/utils/dialog'
  import { formatDuration } from '$lib/utils/format'

  interface Props {
    text: string | undefined
    onclose: () => void
  }

  let { text, onclose }: Props = $props()

  let scrollContainer = $state<HTMLDivElement | null>(null)
  let scrollProgress = $state(0)

  let wakeLock: WakeLockSentinel | null = null

  $effect(() => {
    let disposed = false

    async function requestWakeLock(): Promise<void> {
      if ('wakeLock' in navigator) {
        try {
          const sentinel = await navigator.wakeLock.request('screen')
          // The overlay may have closed while the request was pending.
          if (disposed) {
            sentinel.release()
            return
          }
          wakeLock?.release()
          wakeLock = sentinel
        } catch {
          // Some browsers deny wake lock while hidden, low on power, or unsupported.
        }
      }
    }

    requestWakeLock()

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      wakeLock?.release()
      wakeLock = null
    }
  })

  function handleScroll(): void {
    if (!scrollContainer) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const maxScroll = scrollHeight - clientHeight
    scrollProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0
  }

  const hasText = $derived(!!text?.trim())

  const wordCount = $derived(text?.trim().split(/\s+/).filter(Boolean).length ?? 0)
  // Broadcast reading pace: 150 words per minute.
  const readingTimeSeconds = $derived(Math.ceil((wordCount / 150) * 60))
  const readingTimeFormatted = $derived(formatDuration(readingTimeSeconds))

  // Focus the dialog itself, not its close button, so Space keeps scrolling the script.
  function openFocused(dialog: HTMLDialogElement): () => void {
    const teardown = showModal(dialog)
    dialog.focus()
    return teardown
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      onclose()
      return
    }

    // Space scrolls the script, but must still activate a focused button.
    if (event.key === ' ' && event.target instanceof HTMLButtonElement) return

    if (!scrollContainer) return

    const scrollAmount = 100

    switch (event.key) {
      case ' ':
      case 'ArrowDown':
        event.preventDefault()
        scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' })
        break
      case 'ArrowUp':
        event.preventDefault()
        scrollContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' })
        break
      case 'Home':
        event.preventDefault()
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
        break
      case 'End':
        event.preventDefault()
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
        break
      case 'PageDown':
        event.preventDefault()
        scrollContainer.scrollBy({ top: scrollContainer.clientHeight * 0.8, behavior: 'smooth' })
        break
      case 'PageUp':
        event.preventDefault()
        scrollContainer.scrollBy({ top: -scrollContainer.clientHeight * 0.8, behavior: 'smooth' })
        break
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<dialog
  class="fixed inset-0 m-0 flex h-full max-h-none w-full max-w-none flex-col overflow-hidden border-0 bg-black transition-opacity duration-200 focus:outline-hidden starting:opacity-0"
  aria-label="Leesmodus"
  tabindex="-1"
  oncancel={e => {
    e.preventDefault()
    onclose()
  }}
  {@attach openFocused}
>
  <div class="absolute top-0 right-0 left-0 z-10 h-1 bg-white/5">
    <div
      class="h-full origin-left bg-primary transition-transform duration-150 ease-out"
      style="transform: scaleX({scrollProgress / 100})"
    ></div>
  </div>

  {#if hasText}
    <div class="relative flex min-h-14 shrink-0 items-center justify-center px-4 py-5 md:py-4">
      <div class="flex items-center gap-2 font-mono text-xs text-white/60 tabular-nums md:text-sm">
        <span class="font-medium text-white/90">~{readingTimeFormatted}</span>
        <span class="size-1 rounded-full bg-primary opacity-80"></span>
        <span>{wordCount} woorden</span>
      </div>
    </div>

    <div
      bind:this={scrollContainer}
      onscroll={handleScroll}
      class="relative flex-1 overflow-x-hidden overflow-y-auto scroll-smooth before:pointer-events-none before:sticky before:top-0 before:right-0 before:left-0 before:z-5 before:-mb-8 before:block before:h-8 before:bg-linear-to-b before:from-black before:to-transparent"
    >
      <div class="mx-auto max-w-5xl px-5 pt-4 pb-24 md:px-12 md:pt-8 lg:px-16">
        <p
          class="font-mono text-[clamp(1.125rem,2.5vw+0.5rem,2rem)] leading-[1.9] tracking-wide wrap-break-word whitespace-pre-wrap text-white/95 first-letter:float-left first-letter:mt-[0.05em] first-letter:mr-[0.08em] first-letter:text-[3.5em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-primary"
        >
          {text}
        </p>
      </div>
    </div>

    <button
      class="fixed right-5 bottom-5 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-content transition-[background-color,transform] duration-150 ease-out hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95 md:right-6 md:bottom-6 md:size-14"
      onclick={onclose}
      aria-label="Sluiten (Escape)"
    >
      <X
        aria-hidden="true"
        class="size-5 md:size-6"
      />
    </button>
  {:else}
    <div class="flex flex-1 flex-col items-center justify-center gap-4 text-white/60">
      <TriangleAlert
        aria-hidden="true"
        class="size-12 text-primary opacity-60"
      />
      <p class="font-mono text-lg">Geen tekst beschikbaar</p>
      <button
        class="mt-4 cursor-pointer border-none bg-transparent font-mono text-sm text-white/60 transition-colors hover:text-white/80"
        onclick={onclose}
      >
        Sluiten
      </button>
    </div>
  {/if}
</dialog>
