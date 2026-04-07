<script lang="ts">
  import { getMediaUrl } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { formatDateTime, formatDuration, formatFileSize } from '$lib/utils/format'
  import { ArchiveX, Download, FileText, Zap } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'

  let { data } = $props()

  let downloading = $state(false)

  async function handleDownload(): Promise<void> {
    const url = getMediaUrl(data.bulletin.audio_url)
    if (!url) return

    downloading = true
    try {
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = data.bulletin.filename || 'bulletin.wav'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Download mislukt')
    } finally {
      downloading = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Bulletin details"
    subtitle="{data.bulletin.station_name} - {formatDateTime(data.bulletin.created_at)}"
  />

  <div class="grid gap-6 md:grid-cols-2">
    <!-- Info Card -->
    <div class="card bg-base-100">
      <div class="card-body">
        <h2 class="card-title">Informatie</h2>
        <dl class="space-y-2">
          <div class="flex justify-between">
            <dt class="page-subtitle">Zender</dt>
            <dd class="font-medium">{data.bulletin.station_name}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="page-subtitle">Nieuwslezer</dt>
            <dd>{data.stories[0]?.voice_name ?? '-'}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="page-subtitle">Aangemaakt</dt>
            <dd>{formatDateTime(data.bulletin.created_at)}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="page-subtitle">Duur</dt>
            <dd>{formatDuration(data.bulletin.duration_seconds)}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="page-subtitle">Bestandsnaam</dt>
            <dd>{data.bulletin.filename || '-'}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="page-subtitle">Bestandsgrootte</dt>
            <dd>{formatFileSize(data.bulletin.file_size)}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="page-subtitle">Aantal berichten</dt>
            <dd>{data.bulletin.story_count ?? 0}</dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Audio Card -->
    <div class="card bg-base-100">
      <div class="card-body">
        <h2 class="card-title">Audio</h2>
        {#if data.bulletin.file_purged_at}
          <div class="flex items-center gap-3 rounded-lg bg-base-200 p-4">
            <ArchiveX
              aria-hidden="true"
              class="h-5 w-5 shrink-0 text-base-content/50"
            />
            <p class="text-sm text-base-content/70">
              Audiobestand is opgeruimd op {formatDateTime(data.bulletin.file_purged_at)}
            </p>
          </div>
        {:else if data.bulletin.audio_url}
          <audio
            controls
            class="w-full"
          >
            <source
              src={getMediaUrl(data.bulletin.audio_url)}
              type="audio/wav"
            />
            Je browser ondersteunt geen audio weergave.
          </audio>
          <div class="mt-4 flex gap-2">
            <button
              onclick={handleDownload}
              disabled={downloading}
              class="btn btn-outline btn-sm"
            >
              {#if downloading}
                <span class="loading loading-xs loading-spinner"></span>
              {:else}
                <Download class="h-4 w-4" />
              {/if}
              Download
            </button>
          </div>
        {:else}
          <p class="page-subtitle">Geen audio beschikbaar</p>
        {/if}
      </div>
    </div>
  </div>

  <!-- Stories Card -->
  {#if data.stories.length > 0}
    <div class="card bg-base-100">
      <div class="card-body">
        <h2 class="card-title">Berichten in dit bulletin</h2>
        <ul class="space-y-2">
          {#each data.stories as story, index (story.id)}
            <li class="flex items-start gap-3 rounded-lg bg-base-200/50 p-3">
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
              >
                {index + 1}
              </span>
              <div class="min-w-0 flex-1">
                <a
                  href="/stories/{story.id}/edit"
                  class="inline-flex items-center gap-1.5 font-medium hover:text-primary hover:underline"
                >
                  {story.title}
                  {#if story.is_breaking}
                    <span
                      class="text-primary"
                      title="Breaking nieuws"
                    >
                      <Zap
                        aria-hidden="true"
                        class="h-3.5 w-3.5 fill-current"
                      />
                    </span>
                  {/if}
                </a>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-base-content/60">
                  <span>{formatDuration(story.duration_seconds)}</span>
                  {#if story.voice_name}
                    <span>•</span>
                    <span>{story.voice_name}</span>
                  {/if}
                </div>
              </div>
              <FileText
                aria-hidden="true"
                class="h-4 w-4 shrink-0 text-base-content/40"
              />
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-2">
    <a
      href="/bulletins"
      class="btn btn-ghost">Terug naar overzicht</a
    >
  </div>
</div>
