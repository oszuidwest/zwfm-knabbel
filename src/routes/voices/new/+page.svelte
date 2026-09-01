<script lang="ts">
  import { goto } from '$app/navigation'
  import { notifyMutationError } from '$lib/api/client'
  import { voiceSchema, type VoiceFormData } from '$lib/schemas/voice'
  import { postVoices } from '$lib/api/generated/sdk.gen'
  import { toVoiceApiFormat } from '$lib/api/voices'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { resolveInternalHref } from '$lib/utils/routes'
  import { TextInput, FormActions, PageHeader } from '$lib/components/ui'

  const auth = getAuthContext()

  let form = $state<VoiceFormData>({
    name: '',
    elevenlabs_voice_id: '',
  })

  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  const canWrite = $derived(auth.can('voices', 'write'))

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    if (!canWrite) return

    const result = validateForm(voiceSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      await postVoices({ body: toVoiceApiFormat(result.data) })
      toast.success('Stem aangemaakt')
      goto(resolveInternalHref('/voices'))
    } catch (err) {
      notifyMutationError(err, 'Aanmaken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Nieuwe stem"
    subtitle="Voeg een nieuwe stem toe aan het systeem"
  />

  <div class="card bg-base-100">
    <div class="card-body">
      <form
        onsubmit={handleSubmit}
        class="space-y-6"
      >
        <TextInput
          id="name"
          label="Naam"
          bind:value={form.name}
          error={errors.name}
          placeholder="Hugo de Geweldige"
          disabled={!canWrite}
        />

        <TextInput
          id="elevenlabs_voice_id"
          label="ElevenLabs voice-ID"
          bind:value={form.elevenlabs_voice_id}
          error={errors.elevenlabs_voice_id}
          placeholder="Bijv. JBFqnCBsd6RMkjVDRZzb"
          hint="Laat leeg voor een stem zonder AI-spraaksynthese."
          disabled={!canWrite}
        />

        <FormActions
          cancelHref="/voices"
          {submitting}
          canSubmit={canWrite}
        />
      </form>
    </div>
  </div>
</div>
