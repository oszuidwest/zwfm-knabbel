<script lang="ts">
  import { goto } from '$app/navigation'
  import { ApiError, getMediaUrl, notifyMutationError } from '$lib/api/client'
  import { storySchema, type StoryFormData } from '$lib/schemas/story'
  import {
    getStoriesIdBulletins,
    postStoriesIdAudio,
    postStoriesIdTts,
    putStoriesId,
  } from '$lib/api/generated/sdk.gen'
  import { toStoryApiFormat } from '$lib/api/stories'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { toSelectOptions, toStringOrEmpty } from '$lib/utils/form'
  import { statusOptions } from '$lib/utils/labels'
  import { formatDateTime, formatDuration } from '$lib/utils/format'
  import { resolveInternalHref } from '$lib/utils/routes'
  import {
    AIAudioField,
    BreakingToggle,
    TextInput,
    TextareaInput,
    SelectInput,
    FileInput,
    FormActions,
    FormField,
    PageHeader,
    WeekdayCheckboxGroup,
  } from '$lib/components/ui'
  import { CassetteTape, Eye, Podcast } from '$lib/components/icons'
  import ReadMode from '$lib/components/ReadMode.svelte'
  import { maskToWeekdays, type Bulletin } from '$lib/types'
  import type { PageData } from './$types'

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()
  const auth = getAuthContext()

  let audioFile = $state<File | null>(null)
  let showReadMode = $state(false)

  function initialForm(): StoryFormData {
    return {
      title: data.story.title ?? '',
      text: data.story.text ?? '',
      voice_id: toStringOrEmpty(data.story.voice_id),
      status: data.story.status ?? 'draft',
      start_date: data.story.start_date?.split('T')[0] ?? '',
      end_date: data.story.end_date?.split('T')[0] ?? '',
      weekdays: maskToWeekdays(data.story.weekdays ?? 127),
      is_breaking: data.story.is_breaking ?? false,
    }
  }

  function initialBulletins(): Bulletin[] {
    return data.bulletins
  }

  function initialBulletinsTotal(): number {
    return data.bulletinsTotal
  }

  function initialAudioUrl(): string | undefined {
    return data.story.audio_file ? getMediaUrl(data.story.audio_url) : undefined
  }

  function cacheBust(url: string | undefined): string | undefined {
    if (!url) return undefined
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  }

  let form = $state<StoryFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let generating = $state(false)
  let currentAudioUrl = $state(initialAudioUrl())

  let bulletins = $state.raw<Bulletin[]>(initialBulletins())
  let bulletinsTotal = $state(initialBulletinsTotal())
  let loadingMore = $state(false)

  const voiceOptions = $derived(toSelectOptions(data.voices))
  const selectedVoice = $derived(data.voices.find(voice => String(voice.id) === form.voice_id))
  const hasMoreBulletins = $derived(bulletins.length < bulletinsTotal)
  const canWrite = $derived(auth.can('stories', 'write'))
  const formDisabled = $derived(!canWrite || submitting || generating)

  function setVoiceId(value: string | null | undefined): void {
    form.voice_id = value ?? ''
    if (selectedVoice?.elevenlabs_voice_id) audioFile = null
  }

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
          if (!(err instanceof ApiError && err.notified)) {
            toast.warning('Bericht bijgewerkt, maar audio upload mislukt')
          }
          goto(resolveInternalHref('/stories'))
          return
        }
      }

      toast.success('Bericht bijgewerkt')
      goto(resolveInternalHref('/stories'))
    } catch (err) {
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
        query: currentAudioUrl ? { force: 'true' } : undefined,
      })

      currentAudioUrl = cacheBust(getMediaUrl(data.story.audio_url))
      toast.success('Audio gegenereerd')
    } catch (err) {
      notifyMutationError(err, 'Audio genereren mislukt')
    } finally {
      generating = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader title={canWrite ? 'Bericht bewerken' : 'Bericht bekijken'}>
    {#snippet actions()}
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
    {/snippet}
  </PageHeader>

  <div class="card bg-base-100">
    <div class="card-body">
      <form
        onsubmit={handleSubmit}
        class="space-y-6"
      >
        <TextInput
          id="title"
          label="Titel"
          bind:value={form.title}
          error={errors.title}
          placeholder="Titel van het bericht"
          disabled={formDisabled}
        />

        <TextareaInput
          id="text"
          label="Tekst"
          bind:value={form.text}
          error={errors.text}
          placeholder="De tekst die wordt voorgelezen"
          rows={8}
          disabled={formDisabled}
        />

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectInput
            id="voice_id"
            label="Stem"
            bind:value={() => form.voice_id, setVoiceId}
            options={voiceOptions}
            emptyOption="Geen stem geselecteerd"
            disabled={formDisabled}
          />

          <FormField
            id="status"
            label="Status"
            error={errors.status}
          >
            <div class="join w-full">
              <select
                id="status"
                class={['select join-item flex-1', errors.status && 'select-error']}
                bind:value={form.status}
                disabled={formDisabled}
              >
                {#each statusOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              <BreakingToggle
                bind:checked={form.is_breaking}
                disabled={formDisabled}
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
            disabled={formDisabled}
          />

          <TextInput
            id="end_date"
            label="Einddatum"
            type="date"
            bind:value={form.end_date}
            error={errors.end_date}
            disabled={formDisabled}
          />
        </div>

        <WeekdayCheckboxGroup
          bind:value={form.weekdays}
          disabled={formDisabled}
        />

        {#if selectedVoice?.elevenlabs_voice_id}
          <AIAudioField
            voiceName={selectedVoice.name}
            mode="edit"
            {generating}
            disabled={formDisabled}
            audioUrl={currentAudioUrl}
            ongenerate={handleGenerateAudio}
          />
        {:else}
          <FileInput
            id="audio"
            label="Audiobestand"
            accept="audio/wav,audio/*"
            existingAudioUrl={currentAudioUrl}
            hint={audioFile?.name}
            onchange={file => (audioFile = file)}
            disabled={formDisabled}
          />
        {/if}

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
        Uitgezonden in bulletins
        {#if bulletinsTotal > 0}
          <span class="text-sm font-normal text-base-content/60">({bulletinsTotal})</span>
        {/if}
      </h2>

      {#if bulletins.length === 0}
        <p class="text-sm text-base-content/60">
          Dit bericht is nog niet uitgezonden in een bulletin.
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
