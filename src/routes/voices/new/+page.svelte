<script lang="ts">
  import { goto } from '$app/navigation'
  import { voiceSchema, type VoiceFormData } from '$lib/schemas/voice'
  import { voicesApi } from '$lib/api/voices'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { TextInput, FormActions, PageHeader } from '$lib/components/ui'

  let form = $state<VoiceFormData>({
    name: '',
  })

  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

    const result = validateForm(voiceSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      await voicesApi.create(form)
      toast.success('Stem aangemaakt')
      goto('/voices')
    } catch {
      toast.error('Aanmaken mislukt')
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
        />

        <FormActions
          cancelHref="/voices"
          {submitting}
        />
      </form>
    </div>
  </div>
</div>
