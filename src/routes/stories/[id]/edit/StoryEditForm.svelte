<script lang="ts">
  import { goto } from '$app/navigation'
  import { ApiError, getMediaUrl, notifyMutationError } from '$lib/api/client'
  import { storySchema, type StoryFormData } from '$lib/schemas/story'
  import { storiesApi } from '$lib/api/stories'
  import { bulletinsApi } from '$lib/api/bulletins'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { toSelectOptions, toStringOrEmpty } from '$lib/utils/form'
  import { statusOptions } from '$lib/utils/labels'
  import { formatDateTime, formatDuration } from '$lib/utils/format'
  import { resolveInternalHref } from '$lib/utils/routes'
  import {
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
  import { CassetteTape, Eye, Podcast, Info } from '$lib/components/icons'
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

  let form = $state<StoryFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  let bulletins = $state.raw<Bulletin[]>(initialBulletins())
  let bulletinsTotal = $state(initialBulletinsTotal())
  let loadingMore = $state(false)

  const voiceOptions = $derived(toSelectOptions(data.voices))
  const hasMoreBulletins = $derived(bulletins.length < bulletinsTotal)
  const canWrite = $derived(auth.can('stories', 'write'))

  async function loadMoreBulletins(): Promise<void> {
    if (loadingMore || !data.story.id) return
    loadingMore = true
    try {
      const res = await bulletinsApi.getByStory(data.story.id, {
        limit: data.bulletinsPageSize,
        offset: bulletins.length,
      })
      bulletins = [...bulletins, ...res.data]
      bulletinsTotal = res.total
    } catch {
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
      await storiesApi.update(data.story.id!, storiesApi.toApiFormat(form))

      if (audioFile) {
        try {
          await storiesApi.uploadAudio(data.story.id!, audioFile)
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

  {#if !canWrite}
    <div
      class="alert alert-info"
      role="status"
    >
      <Info
        aria-hidden="true"
        class="h-5 w-5"
      />
      <span>Alleen-lezen weergave — je hebt geen schrijfrechten.</span>
    </div>
  {/if}

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
          disabled={!canWrite}
        />

        <TextareaInput
          id="text"
          label="Tekst"
          bind:value={form.text}
          error={errors.text}
          placeholder="De tekst die wordt voorgelezen"
          rows={8}
          disabled={!canWrite}
        />

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectInput
            id="voice_id"
            label="Stem"
            bind:value={form.voice_id}
            options={voiceOptions}
            emptyOption="Geen stem geselecteerd"
            disabled={!canWrite}
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
                disabled={!canWrite}
              >
                {#each statusOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              <BreakingToggle
                bind:checked={form.is_breaking}
                disabled={!canWrite}
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
            disabled={!canWrite}
          />

          <TextInput
            id="end_date"
            label="Einddatum"
            type="date"
            bind:value={form.end_date}
            error={errors.end_date}
            disabled={!canWrite}
          />
        </div>

        <WeekdayCheckboxGroup
          bind:value={form.weekdays}
          disabled={!canWrite}
        />

        <FileInput
          id="audio"
          label="Audiobestand"
          accept="audio/wav,audio/*"
          existingAudioUrl={data.story.audio_file ? getMediaUrl(data.story.audio_url) : undefined}
          hint={audioFile?.name}
          onchange={file => (audioFile = file)}
          disabled={!canWrite}
        />

        <FormActions
          cancelHref="/stories"
          {submitting}
          canSubmit={canWrite}
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
