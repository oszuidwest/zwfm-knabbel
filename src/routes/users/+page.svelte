<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { ApiError, isProblemDetails, notifyMutationError } from '$lib/api/client'
  import { usersApi } from '$lib/api/users'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { toast } from '$lib/stores/toast'
  import { getRoleLabel } from '$lib/utils/labels'
  import { User } from '$lib/components/icons'
  import { ListPage, TableActions } from '$lib/components/ui'
  import type { User as UserType } from '$lib/types'

  let { data } = $props()
  const auth = getAuthContext()

  const canWrite = $derived(auth.can('users', 'write'))

  async function handleDelete(user: UserType): Promise<void> {
    if (!confirm(`Weet je zeker dat je "${user.username ?? 'deze gebruiker'}" wilt verwijderen?`)) {
      return
    }

    try {
      await usersApi.delete(user.id!)
      toast.success('Gebruiker verwijderd')
      await invalidateAll()
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        isProblemDetails(err.details) &&
        err.details.type === 'https://babbel.api/problems/admin-constraint'
      ) {
        toast.error('Kan laatste admin niet verwijderen')
        return
      }
      if (err instanceof ApiError && err.status === 409) {
        const detail = isProblemDetails(err.details) ? err.details.detail : undefined
        const message = detail || (err.message !== 'Request failed' ? err.message : undefined)
        toast.error(message ?? 'Verwijderen mislukt')
        return
      }
      notifyMutationError(err, 'Verwijderen mislukt')
    }
  }
</script>

<ListPage
  title="Gebruikers"
  subtitle="{data.pagination.totalItems} gebruikers"
  items={data.users}
  icon={User}
  newHref="/users/new"
  newLabel="Nieuwe gebruiker"
  editHref={user => `/users/${user.id}/edit`}
  emptyTitle="Geen gebruikers"
  emptyDescription={canWrite
    ? 'Voeg je eerste gebruiker toe om te beginnen.'
    : 'Nog geen gebruikers aanwezig.'}
  pagination={data.pagination}
  onDelete={handleDelete}
  deleteLabel={user => user.username ?? 'deze gebruiker'}
  canCreate={canWrite}
  canEdit={canWrite}
  canDelete={canWrite}
>
  {#snippet cardContent(user)}
    <div class="flex items-center gap-2">
      <h3 class="truncate font-medium">{user.username}</h3>
      <span class="badge badge-outline badge-sm">{getRoleLabel(user.role)}</span>
    </div>
    <div class="truncate text-sm text-base-content/60">
      {user.full_name}
    </div>
  {/snippet}

  {#snippet tableHeader()}
    <th>Gebruikersnaam</th>
    <th>Naam</th>
    <th>E-mail</th>
    <th>Rol</th>
    <th class="w-24">Acties</th>
  {/snippet}

  {#snippet tableRow(user)}
    <td class="font-medium">{user.username}</td>
    <td>{user.full_name}</td>
    <td>{user.email || '-'}</td>
    <td>
      <span class="badge badge-outline">
        {getRoleLabel(user.role)}
      </span>
    </td>
    <td>
      <TableActions
        editHref="/users/{user.id}/edit"
        onDelete={() => handleDelete(user)}
        canEdit={canWrite}
        canDelete={canWrite}
      />
    </td>
  {/snippet}
</ListPage>
