<script lang="ts">
  import { goto } from '$app/navigation'
  import { userSchema, type UserFormData } from '$lib/schemas/user'
  import { usersApi } from '$lib/api/users'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { roleOptions } from '$lib/utils/labels'
  import { TextInput, SelectInput, FormActions, PageHeader } from '$lib/components/ui'
  import type { UserInput } from '$lib/types'

  let { data } = $props()

  let form = $state<UserFormData>({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer',
  })
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)

  // Reset form when data changes (navigation between users or after save)
  $effect(() => {
    form = {
      username: data.user.username ?? '',
      full_name: data.user.full_name ?? '',
      email: data.user.email ?? '',
      password: '',
      confirmPassword: '',
      role: data.user.role ?? 'viewer',
    }
    errors = {}
  })

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()

    const result = validateForm(userSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      const updateData: Partial<UserInput> = {
        username: form.username,
        full_name: form.full_name,
        email: form.email || null,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      }

      await usersApi.update(data.user.id!, updateData)
      toast.success('Gebruiker bijgewerkt')
      goto('/users')
    } catch {
      toast.error('Bijwerken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title="Gebruiker bewerken"
    subtitle={data.user.full_name || data.user.username || ''}
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

        <div class="divider">Wachtwoord wijzigen (optioneel)</div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="password"
            label="Nieuw wachtwoord"
            type="password"
            bind:value={form.password}
            error={errors.password}
            placeholder="Laat leeg om niet te wijzigen"
          />

          <TextInput
            id="confirmPassword"
            label="Bevestig nieuw wachtwoord"
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
