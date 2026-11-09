<script lang="ts">
  import { goto } from '$app/navigation'
  import { untrack } from 'svelte'
  import {
    ApiError,
    getFieldErrors,
    getMediaUrl,
    getUploadFailure,
    notifyMutationError,
  } from '#lib/api/client.js'
  import { storySchema, type StoryFormData } from '#lib/schemas/story.js'
  import {
    getStoriesIdBulletins,
    postStoriesIdAudio,
    postStoriesIdTts,
    putStoriesId,
  } from '#lib/api/generated/sdk.gen.js'
  import { toStoryApiFormat } from '#lib/api/stories.js'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { toast } from '#lib/stores/toast.js'
  import { validateForm } from '#lib/utils/validation.js'
  import { toStringOrEmpty } from '#lib/utils/form.js'
  import { formatDateTime, formatDuration } from '#lib/utils/format.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import { FormActions, PageHeader } from '#lib/components/ui/index.js'
  import { CassetteTape, Eye, Podcast } from '#lib/components/icons.js'
  import ReadMode from '#lib/components/ReadMode.svelte'
  import WordPressLink from '#lib/components/WordPressLink.svelte'
  import { maskToWeekdays, type Bulletin } from '#lib/types/index.js'
  import StoryFields from '../../StoryFields.svelte'
  import type { PageData } from './$types'

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()
  const auth = getAuthContext()

  let audioFile = $state<File | null>(null)
  let showReadMode = $state(false)

  function cacheBust(url: string | undefined): string | undefined {
    if (!url) return undefined
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  }

  // The page remounts this form for another story, so the state starts from the first data.
  const initial = untrack(() => data)
  const story = initial.story

  let form = $state<StoryFormData>({
    title: story.title ?? '',
    text: story.text ?? '',
    voice_id: toStringOrEmpty(story.voice_id),
    status: story.status ?? 'draft',
    start_date: story.start_date,
    end_date: story.end_date,
    weekdays: maskToWeekdays(story.weekdays ?? 127),
    is_breaking: story.is_breaking ?? false,
  })
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let generating = $state(false)
  let currentAudioUrl = $state(story.audio_file ? getMediaUrl(story.audio_url) : undefined)

  let bulletins = $state.raw<Bulletin[]>(initial.bulletins)
  let bulletinsTotal = $state(initial.bulletinsTotal)
  let loadingMore = $state(false)

  const selectedVoice = $derived(data.voices.find(voice => String(voice.id) === form.voice_id))
  const hasMoreBulletins = $derived(bulletins.length < bulletinsTotal)
  const canWrite = $derived(auth.can('stories', 'write'))
  const formDisabled = $derived(!canWrite || submitting || generating)

  async function loadMoreBulletins(): Promise<void> {
    if (loadingMore || !data.story.id) return
    loadingMore = true
    try {
      const res = await getStoriesIdBulletins({
        path: { id: data.story.id },
        query: { limit: data.bulletinsPageSize, offset: bulletins.length },
      })
      bulletins = [...bulletins, ...res.data]
      bulletinsTotal = res.total
    } catch (err) {
      console.error('[stories] load more bulletins failed', err)
      toast.error('Kon meer bulletins niet laden')
    } finally {
      loadingMore = false
    }
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    if (!canWrite) return

    const result = validateForm(storySchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      await putStoriesId({ path: { id: data.story.id }, body: toStoryApiFormat(result.data) })

      if (audioFile) {
        try {
          await postStoriesIdAudio({ path: { id: data.story.id }, body: { audio: audioFile } })
        } catch (err) {
          // The story is saved; keep the form open to retry the upload.
          if (!(err instanceof ApiError && err.notified)) {
            errors = { audio: getUploadFailure(err) }
            toast.warning('Bericht bijgewerkt, maar audio upload mislukt')
          }
          return
        }
      }

      toast.success('Bericht bijgewerkt')
      await goto(resolveInternalHref('/stories'))
    } catch (err) {
      errors = getFieldErrors(err)
      notifyMutationError(err, 'Bijwerken mislukt')
    } finally {
      submitting = false
    }
  }

  async function handleGenerateAudio(): Promise<void> {
    if (!canWrite || !selectedVoice?.elevenlabs_voice_id || submitting || generating) return

    const result = validateForm(storySchema, form)
    if (!result.success) {
      errors = result.errors
      toast.error('Controleer de velden')
      return
    }

    if (currentAudioUrl && !confirm('Bestaande audio vervangen door nieuw gegenereerde audio?'))
      return
    errors = {}
    generating = true
    try {
      await putStoriesId({ path: { id: data.story.id }, body: toStoryApiFormat(result.data) })
      await postStoriesIdTts({
        path: { id: data.story.id },
        query: { force: !!currentAudioUrl },
      })

      currentAudioUrl = cacheBust(getMediaUrl(data.story.audio_url))
      toast.success('Audio gegenereerd')
    } catch (err) {
      errors = getFieldErrors(err)
      notifyMutationError(err, 'Audio genereren mislukt')
    } finally {
      generating = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader title={canWrite ? 'Bericht bewerken' : 'Bericht bekijken'}>
    {#snippet actions()}
      <div class="flex items-center gap-3">
        <WordPressLink story={data.story} />
        <button
          type="button"
          class="btn btn-outline"
          onclick={() => (showReadMode = true)}
          aria-label="Open leesmodus"
        >
          <CassetteTape
            aria-hidden="true"
            class="h-5 w-5"
          />
          Leesmodus
        </button>
      </div>
    {/snippet}
  </PageHeader>

  <div class="card bg-base-100">
    <div class="card-body">
      <form
        onsubmit={handleSubmit}
        class="space-y-6"
      >
        <StoryFields
          bind:form
          bind:audioFile
          {errors}
          voices={data.voices}
          {selectedVoice}
          mode="edit"
          {generating}
          disabled={formDisabled}
          audioUrl={currentAudioUrl}
          ongenerate={handleGenerateAudio}
        />

        <FormActions
          cancelHref="/stories"
          {submitting}
          canSubmit={canWrite && !generating}
          forbidTooltip={canWrite ? 'Audio wordt gegenereerd…' : 'Geen rechten'}
        />
      </form>
    </div>
  </div>

  <div class="card bg-base-100">
    <div class="card-body">
      <h2 class="card-title">
        <Podcast
          aria-hidden="true"
          class="h-5 w-5"
        />
        Opgenomen in bulletins
        {#if bulletinsTotal > 0}
          <span class="text-sm font-normal text-base-content/60">({bulletinsTotal})</span>
        {/if}
      </h2>

      {#if bulletins.length === 0}
        <p class="text-sm text-base-content/60">
          Dit bericht is nog niet opgenomen in een bulletin.
        </p>
      {:else}
        <ul class="divide-y divide-base-200">
          {#each bulletins as bulletin (bulletin.id)}
            <li class="flex items-center justify-between gap-3 py-3">
              <div class="min-w-0">
                <div class="truncate font-medium">{bulletin.station_name}</div>
                <div class="flex flex-wrap items-center gap-2 text-sm text-base-content/60">
                  <span>{formatDateTime(bulletin.created_at)}</span>
                  <span>•</span>
                  <span>{formatDuration(bulletin.duration_seconds)}</span>
                  <span>•</span>
                  <span>{bulletin.story_count ?? 0} berichten</span>
                </div>
              </div>
              <a
                href={resolveInternalHref(`/bulletins/${bulletin.id}`)}
                class="btn btn-square btn-ghost btn-sm"
                aria-label="Open bulletin"
              >
                <Eye class="h-4 w-4" />
              </a>
            </li>
          {/each}
        </ul>

        {#if hasMoreBulletins}
          <div class="mt-4 flex justify-center">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              onclick={loadMoreBulletins}
              disabled={loadingMore}
            >
              {loadingMore ? 'Laden…' : 'Meer laden'}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

{#if showReadMode}
  <ReadMode
    text={form.text}
    onclose={() => (showReadMode = false)}
  />
{/if}
