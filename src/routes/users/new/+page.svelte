<script lang="ts">
  import { goto } from '$app/navigation'
  import { userCreateSchema, type UserFormData } from '$lib/schemas/user'
  import { usersApi } from '$lib/api/users'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { roleOptions } from '$lib/utils/labels'
  import { TextInput, SelectInput, FormActions, PageHeader } from '$lib/components/ui'

  let form = $state<UserFormData>({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'editor',
  })

  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

    const result = validateForm(userCreateSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      await usersApi.create({
        username: form.username,
        full_name: form.full_name,
        email: form.email || undefined,
        password: form.password!,
        role: form.role,
      })
      toast.success('Gebruiker aangemaakt')
      goto('/users')
    } catch {
      toast.error('Aanmaken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Nieuwe gebruiker"
    subtitle="Voeg een nieuwe gebruiker toe aan het systeem"
  />

  <div class="card bg-base-100">
    <div class="card-body">
      <form
        onsubmit={handleSubmit}
        class="space-y-6"
      >
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="username"
            label="Gebruikersnaam"
            bind:value={form.username}
            error={errors.username}
            placeholder="bijv. jdoe"
          />

          <TextInput
            id="full_name"
            label="Volledige naam"
            bind:value={form.full_name}
            error={errors.full_name}
            placeholder="bijv. Jan de Vries"
          />
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="email"
            label="E-mail (optioneel)"
            type="email"
            bind:value={form.email}
            error={errors.email}
            placeholder="bijv. jan@example.nl"
          />

          <SelectInput
            id="role"
            label="Rol"
            bind:value={form.role}
            options={roleOptions}
            error={errors.role}
          />
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="password"
            label="Wachtwoord"
            type="password"
            bind:value={form.password}
            error={errors.password}
          />

          <TextInput
            id="confirmPassword"
            label="Bevestig wachtwoord"
            type="password"
            bind:value={form.confirmPassword}
            error={errors.confirmPassword}
          />
        </div>

        <FormActions
          cancelHref="/users"
          {submitting}
        />
      </form>
    </div>
  </div>
</div>
