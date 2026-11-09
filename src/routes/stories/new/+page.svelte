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
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import { FormActions, PageHeader } from '#lib/components/ui/index.js'
  import { allWeekdaysTrue } from '#lib/types/index.js'
  import StoryFields from '../StoryFields.svelte'

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

  const selectedVoice = $derived(data.voices.find(voice => String(voice.id) === form.voice_id))

  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  let generating = $state(false)
  const canWrite = $derived(auth.can('stories', 'write'))
  const formDisabled = $derived(!canWrite || submitting || generating)

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    await createStory(false)
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
        <StoryFields
          bind:form
          bind:audioFile
          {errors}
          voices={data.voices}
          {selectedVoice}
          mode="create"
          {generating}
          disabled={formDisabled}
          ongenerate={() => createStory(true)}
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
</div>
