<script lang="ts">
  import { goto } from '$app/navigation'
  import { storySchema, type StoryFormData } from '$lib/schemas/story'
  import { storiesApi } from '$lib/api/stories'
  import { getMediaUrl } from '$lib/api/client'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { toSelectOptions, toStringOrEmpty } from '$lib/utils/form'
  import { statusOptions } from '$lib/utils/labels'
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
  import { CassetteTape } from '$lib/components/icons'
  import ReadMode from '$lib/components/ReadMode.svelte'
  import { maskToWeekdays, allWeekdaysTrue } from '$lib/types'

  let { data } = $props()
  let audioFile = $state<File | null>(null)
  let showReadMode = $state(false)

  let form = $state<StoryFormData>({
    title: '',
    text: '',
    voice_id: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    weekdays: allWeekdaysTrue(),
    is_breaking: false,
  })
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  const voiceOptions = $derived(toSelectOptions(data.voices))

  // Reset form when data changes (navigation between stories or after save)
  $effect(() => {
    form = {
      title: data.story.title ?? '',
      text: data.story.text ?? '',
      voice_id: toStringOrEmpty(data.story.voice_id),
      status: data.story.status ?? 'draft',
      start_date: data.story.start_date?.split('T')[0] ?? '',
      end_date: data.story.end_date?.split('T')[0] ?? '',
      weekdays: maskToWeekdays(data.story.weekdays ?? 127),
      is_breaking: data.story.is_breaking ?? false,
    }
    errors = {}
    audioFile = null
  })

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

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
        } catch {
          toast.warning('Bericht bijgewerkt, maar audio upload mislukt')
          goto('/stories')
          return
        }
      }

      toast.success('Bericht bijgewerkt')
      goto('/stories')
    } catch {
      toast.error('Bijwerken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader title="Bericht bewerken">
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
        />

        <TextareaInput
          id="text"
          label="Tekst"
          bind:value={form.text}
          error={errors.text}
          placeholder="De tekst die wordt voorgelezen"
          rows={8}
        />

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SelectInput
            id="voice_id"
            label="Stem"
            bind:value={form.voice_id}
            options={voiceOptions}
            emptyOption="Geen stem geselecteerd"
          />

          <FormField
            id="status"
            label="Status"
            error={errors.status}
          >
            <div class="join w-full">
              <select
                id="status"
                class="select-bordered select join-item flex-1"
                class:select-error={errors.status}
                bind:value={form.status}
              >
                {#each statusOptions as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
              <BreakingToggle bind:checked={form.is_breaking} />
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
          />

          <TextInput
            id="end_date"
            label="Einddatum"
            type="date"
            bind:value={form.end_date}
            error={errors.end_date}
          />
        </div>

        <WeekdayCheckboxGroup bind:value={form.weekdays} />

        <FileInput
          id="audio"
          label="Audiobestand"
          accept="audio/wav,audio/*"
          existingAudioUrl={data.story.audio_file ? getMediaUrl(data.story.audio_url) : undefined}
          hint={audioFile?.name}
          onchange={file => (audioFile = file)}
        />

        <FormActions
          cancelHref="/stories"
          {submitting}
        />
      </form>
    </div>
  </div>
</div>

<!-- Leesmodus overlay -->
{#if showReadMode}
  <ReadMode
    text={form.text}
    onclose={() => (showReadMode = false)}
  />
{/if}
