<script lang="ts">
  import { X, TriangleAlert } from './icons'
  import { formatDuration } from '$lib/utils/format'

  interface Props {
    text: string | undefined
    onclose: () => void
  }

  let { text, onclose }: Props = $props()

  let scrollContainer = $state<HTMLDivElement | null>(null)
  let scrollProgress = $state(0)

  // Wake Lock to keep screen on
  let wakeLock: WakeLockSentinel | null = null

  $effect(() => {
    async function requestWakeLock(): Promise<void> {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen')
        } catch {
          // Wake lock request failed (e.g., low battery, tab hidden)
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
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      wakeLock?.release()
      wakeLock = null
    }
  })

  // Track scroll progress
  function handleScroll(): void {
    if (!scrollContainer) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const maxScroll = scrollHeight - clientHeight
    scrollProgress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0
  }

  const hasText = $derived(!!text?.trim())

  // Calculate word count and estimated reading time
  const wordCount = $derived(text?.trim().split(/\s+/).filter(Boolean).length ?? 0)
  // Average reading speed for broadcast: ~150 words per minute
  const readingTimeSeconds = $derived(Math.ceil((wordCount / 150) * 60))
  const readingTimeFormatted = $derived(formatDuration(readingTimeSeconds))

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      onclose()
      return
    }

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

<!-- Overlay with atmospheric gradient -->
<div
  class="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black transition-opacity duration-200 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(from_var(--color-primary)_l_c_h/0.08),transparent_50%)] starting:opacity-0"
  role="dialog"
  aria-modal="true"
  aria-label="Leesmodus"
>
  <!-- Progress bar -->
  <div class="absolute top-0 right-0 left-0 z-10 h-[3px] bg-white/5">
    <div
      class="h-full bg-linear-to-r from-primary to-primary/70 shadow-[0_0_12px_oklch(from_var(--color-primary)_l_c_h/0.4)] transition-[width] duration-150 ease-out"
      style="width: {scrollProgress}%"
    ></div>
  </div>

  {#if hasText}
    <!-- Header with metadata -->
    <div class="relative flex min-h-14 shrink-0 items-center justify-center px-4 py-5 md:py-4">
      <div
        class="flex items-center gap-2 font-mono text-xs tracking-widest text-white/60 uppercase md:text-sm"
      >
        <span class="font-medium text-white/90">~{readingTimeFormatted}</span>
        <span class="size-1 rounded-full bg-primary opacity-80"></span>
        <span>{wordCount} woorden</span>
      </div>
    </div>

    <!-- Content with top fade -->
    <div
      bind:this={scrollContainer}
      onscroll={handleScroll}
      class="relative flex-1 overflow-x-hidden overflow-y-auto scroll-smooth before:pointer-events-none before:sticky before:top-0 before:right-0 before:left-0 before:z-[5] before:-mb-8 before:block before:h-8 before:bg-linear-to-b before:from-black before:to-transparent"
    >
      <div class="mx-auto max-w-5xl px-5 pt-4 pb-24 md:px-12 md:pt-8 lg:px-16">
        <p
          class="font-mono text-[clamp(1.125rem,2.5vw+0.5rem,2rem)] leading-[1.9] tracking-wide break-words whitespace-pre-wrap text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] first-letter:float-left first-letter:mt-[0.05em] first-letter:mr-[0.08em] first-letter:text-[3.5em] first-letter:leading-[0.8] first-letter:font-semibold first-letter:text-primary"
        >
          {text}
        </p>
      </div>
    </div>

    <!-- FAB Close button -->
    <button
      class="fixed right-5 bottom-5 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-primary/80 text-white shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_20px_oklch(from_var(--color-primary)_l_c_h/0.4)] backdrop-blur-md transition-all duration-200 ease-out hover:scale-105 hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_0_30px_oklch(from_var(--color-primary)_l_c_h/0.4)] active:scale-95 md:right-6 md:bottom-6 md:size-14"
      onclick={onclose}
      aria-label="Sluiten (Escape)"
    >
      <X
        aria-hidden="true"
        class="size-5 md:size-6"
      />
    </button>
  {:else}
    <!-- Empty state -->
    <div class="flex flex-1 flex-col items-center justify-center gap-4 text-white/40">
      <TriangleAlert
        aria-hidden="true"
        class="size-12 text-primary opacity-60"
      />
      <p class="font-mono text-lg">Geen tekst beschikbaar</p>
      <button
        class="mt-4 cursor-pointer border-none bg-transparent font-mono text-sm text-white/30 transition-colors hover:text-white/50"
        onclick={onclose}
      >
        SLUITEN
      </button>
    </div>
  {/if}
</div>
