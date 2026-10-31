<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    ApiError,
    getFieldErrors,
    getUploadFailure,
    notifyMutationError,
  } from '#lib/api/client.js'
  import { storySchema, type StoryFormData } from '#lib/schemas/story.js'
  import { postStories, postStoriesIdAudio, postStoriesIdTts } from '#lib/api/generated/sdk.gen.js'
  import { toStoryApiFormat } from '#lib/api/stories.js'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { toast } from '#lib/stores/toast.js'
  import { validateForm } from '#lib/utils/validation.js'
  import { toLocalDateString } from '#lib/utils/format.js'
  import { toSelectOptions } from '#lib/utils/form.js'
  import { statusOptions } from '#lib/utils/labels.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import {
    AIAudioField,
    BreakingToggle,
    TextInput,
    TextareaInput,
    SelectInput,
    FileInput,
    FormActions,
    FormField,
    fieldA11y,
    PageHeader,
    WeekdayCheckboxGroup,
  } from '#lib/components/ui/index.js'
  import { allWeekdaysTrue } from '#lib/types/index.js'

  let { data } = $props()
  const auth = getAuthContext()
  let audioFile = $state<File | null>(null)

  const today = toLocalDateString()
  const nextMonth = toLocalDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))

  let form = $state<StoryFormData>({
    title: '',
    text: '',
    voice_id: '',
    status: 'draft',
    start_date: today,
    end_date: nextMonth,
    weekdays: allWeekdaysTrue(),
    is_breaking: false,
  })

  const voiceOptions = $derived(toSelectOptions(data.voices))
  const selectedVoice = $derived(data.voices.find(voice => String(voice.id) === form.voice_id))

  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let generating = $state(false)
  const canWrite = $derived(auth.can('stories', 'write'))
  const formDisabled = $derived(!canWrite || submitting || generating)

  function setVoiceId(value: string | null | undefined): void {
    form.voice_id = value ?? ''
    if (selectedVoice?.elevenlabs_voice_id) audioFile = null
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    await createStory(false)
  }

  async function handleGenerateAudio(): Promise<void> {
    await createStory(true)
  }

  async function createStory(generateAudio: boolean): Promise<void> {
    if (!canWrite || submitting || generating) return
    if (generateAudio && !selectedVoice?.elevenlabs_voice_id) return

    const result = validateForm(storySchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }

    errors = {}

    if (generateAudio) {
      generating = true
    } else {
      submitting = true
    }

    try {
      const story = await postStories({ body: toStoryApiFormat(result.data) })

      if (generateAudio && story.id) {
        try {
          await postStoriesIdTts({ path: { id: story.id } })
          toast.success('Bericht en audio aangemaakt')
        } catch (err) {
          notifyMutationError(err, 'Bericht aangemaakt, maar audio genereren mislukt')
        }
        await goto(resolveInternalHref(`/stories/${story.id}/edit`))
        return
      }

      if (audioFile && story.id) {
        try {
          await postStoriesIdAudio({ path: { id: story.id }, body: { audio: audioFile } })
        } catch (err) {
          if (!(err instanceof ApiError && err.notified)) {
            const reason = getUploadFailure(err)
            toast.warning(`Bericht aangemaakt, maar audio upload mislukt: ${reason}`)
          }
          // Open the saved story so the user can retry the upload.
          await goto(resolveInternalHref(`/stories/${story.id}/edit`))
          return
        }
      }

      toast.success('Bericht aangemaakt')
      await goto(resolveInternalHref('/stories'))
    } catch (err) {
      errors = getFieldErrors(err)
      notifyMutationError(err, 'Aanmaken mislukt')
    } finally {
      submitting = false
      generating = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Nieuw bericht"
    subtitle="Maak een nieuw nieuwsbericht aan"
  />

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
            error={errors.voice_id}
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
                {...fieldA11y('status', errors.status)}
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
            mode="create"
            {generating}
            disabled={formDisabled}
            ongenerate={handleGenerateAudio}
          />
        {:else}
          <FileInput
            id="audio"
            label="Audiobestand (optioneel)"
            accept="audio/wav,audio/*"
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
</div>
