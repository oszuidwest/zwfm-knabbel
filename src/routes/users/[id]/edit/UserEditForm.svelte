<script lang="ts">
  import { goto } from '$app/navigation'
  import { notifyMutationError } from '$lib/api/client'
  import { userSchema, type UserFormData } from '$lib/schemas/user'
  import { usersApi } from '$lib/api/users'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { validateForm } from '$lib/utils/validation'
  import { roleOptions } from '$lib/utils/labels'
  import { resolveInternalHref } from '$lib/utils/routes'
  import { TextInput, SelectInput, FormActions, PageHeader } from '$lib/components/ui'
  import { Info } from '$lib/components/icons'
  import type { UserInput } from '$lib/types'
  import type { PageData } from './$types'

  interface Props {
    data: PageData
  }

  let { data }: Props = $props()
  const auth = getAuthContext()

  function initialForm(): UserFormData {
    return {
      username: data.user.username ?? '',
      full_name: data.user.full_name ?? '',
      email: data.user.email ?? '',
      password: '',
      confirmPassword: '',
      role: data.user.role ?? 'viewer',
    }
  }

  let form = $state<UserFormData>(initialForm())
  let errors = $state<Record<string, string>>({})
  let submitting = $state(false)
  const canWrite = $derived(auth.can('users', 'write'))

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault()
    if (!canWrite) return

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
      const isSelfRoleChange =
        !!auth.user && data.user.id === auth.user.id && form.role !== auth.user.role

      await usersApi.update(data.user.id!, updateData)
      if (isSelfRoleChange) {
        const refreshed = await auth.checkAuth({ force: true })
        if (!refreshed) {
          toast.warning('Je rol is bijgewerkt, maar je sessie kon niet opnieuw worden geladen.')
          goto(resolveInternalHref('/login'))
          return
        }

        toast.success('Je rol is bijgewerkt')
        goto(resolveInternalHref('/stories'))
        return
      }

      toast.success('Gebruiker bijgewerkt')
      goto(resolveInternalHref('/users'))
    } catch (err) {
      notifyMutationError(err, 'Bijwerken mislukt')
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <PageHeader
    title={canWrite ? 'Gebruiker bewerken' : 'Gebruiker bekijken'}
    subtitle={data.user.full_name || data.user.username || ''}
  />

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

        <div class="divider">Wachtwoord wijzigen (optioneel)</div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TextInput
            id="password"
            label="Nieuw wachtwoord"
            type="password"
            bind:value={form.password}
            error={errors.password}
            placeholder="Laat leeg om niet te wijzigen"
            disabled={!canWrite}
          />

          <TextInput
            id="confirmPassword"
            label="Bevestig nieuw wachtwoord"
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
