<script lang="ts">
  import { goto } from '$app/navigation'
  import { getFieldErrors, notifyMutationError } from '#lib/api/client.js'
  import { userCreateSchema, userSchema, type UserFormData } from '#lib/schemas/user.js'
  import { postUsers, putUsersId } from '#lib/api/generated/sdk.gen.js'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { AUTH_DEPENDENCY } from '#lib/auth/session.js'
  import { toast } from '#lib/stores/toast.js'
  import { validateForm } from '#lib/utils/validation.js'
  import { roleOptions } from '#lib/utils/labels.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import { TextInput, SelectInput, FormActions, PageHeader } from '#lib/components/ui/index.js'
  import type { User, UserUpdate } from '#lib/types/index.js'

  interface Props {
    /** The user to edit; without it the form creates a new one. */
    user?: User
  }

  let { user }: Props = $props()
  const auth = getAuthContext()

  function initialForm(): UserFormData {
    return {
      username: user?.username ?? '',
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      password: '',
      confirmPassword: '',
      role: user ? (user.role ?? 'viewer') : 'editor',
    }
  }

  let form = $state<UserFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  const canWrite = $derived(auth.can('users', 'write'))

  async function createUser(): Promise<void> {
    await postUsers({
      body: {
        username: form.username,
        full_name: form.full_name,
        email: form.email || undefined,
        password: form.password!,
        role: form.role,
      },
    })
    toast.success('Gebruiker aangemaakt')
    await goto(resolveInternalHref('/users'))
  }

  async function updateUser(id: number): Promise<void> {
    const updateData: UserUpdate = {
      username: form.username,
      full_name: form.full_name,
      email: form.email,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    }
    const isSelfRoleChange = !!auth.user && id === auth.user.id && form.role !== auth.user.role

    await putUsersId({ path: { id }, body: updateData })
    if (isSelfRoleChange) {
      const refreshed = await auth.checkAuth({ force: true })
      if (!refreshed) {
        toast.warning('Je rol is bijgewerkt, maar je sessie kon niet opnieuw worden geladen.')
        await goto(resolveInternalHref('/login'))
        return
      }

      toast.success('Je rol is bijgewerkt')
      await goto(resolveInternalHref('/stories'), { invalidate: [AUTH_DEPENDENCY] })
      return
    }

    toast.success('Gebruiker bijgewerkt')
    await goto(resolveInternalHref('/users'))
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    if (!canWrite) return

    const result = validateForm(user ? userSchema : userCreateSchema, form)
    if (!result.success) {
      errors = result.errors
      return
    }
    errors = {}

    submitting = true
    try {
      if (user) await updateUser(user.id)
      else await createUser()
    } catch (err) {
      errors = getFieldErrors(err)
      notifyMutationError(err, user ? 'Bijwerken mislukt' : 'Aanmaken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title={user ? (canWrite ? 'Gebruiker bewerken' : 'Gebruiker bekijken') : 'Nieuwe gebruiker'}
    subtitle={user
      ? user.full_name || user.username || ''
      : 'Voeg een nieuwe gebruiker toe aan het systeem'}
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
            disabled={!canWrite}
          />

          <TextInput
            id="full_name"
            label="Volledige naam"
            bind:value={form.full_name}
            error={errors.full_name}
            placeholder="bijv. Jan de Vries"
            disabled={!canWrite}
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
            disabled={!canWrite}
          />

          <SelectInput
            id="role"
            label="Rol"
            bind:value={form.role}
            options={roleOptions}
            error={errors.role}
            disabled={!canWrite}
          />
        </div>

        {#if user}
          <div class="divider">Wachtwoord wijzigen (optioneel)</div>
        {/if}

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="password"
            label={user ? 'Nieuw wachtwoord' : 'Wachtwoord'}
            type="password"
            bind:value={form.password}
            error={errors.password}
            placeholder={user ? 'Laat leeg om niet te wijzigen' : undefined}
            disabled={!canWrite}
          />

          <TextInput
            id="confirmPassword"
            label={user ? 'Bevestig nieuw wachtwoord' : 'Bevestig wachtwoord'}
            type="password"
            bind:value={form.confirmPassword}
            error={errors.confirmPassword}
            disabled={!canWrite}
          />
        </div>

        <FormActions
          cancelHref="/users"
          {submitting}
          canSubmit={canWrite}
        />
      </form>
    </div>
  </div>
</div>
