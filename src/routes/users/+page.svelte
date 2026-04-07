<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { usersApi } from '$lib/api/users'
  import { deleteWithConfirm } from '$lib/utils/crud'
  import { getRoleLabel } from '$lib/utils/labels'
  import { User } from '$lib/components/icons'
  import { ListPage, TableActions } from '$lib/components/ui'
  import type { User as UserType } from '$lib/types'

  let { data } = $props()

  function handleDelete(user: UserType): void {
    deleteWithConfirm({
      name: user.username ?? 'deze gebruiker',
      deleteFn: () => usersApi.delete(user.id!),
      onSuccess: () => invalidateAll(),
      successMessage: 'Gebruiker verwijderd',
    })
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
  emptyDescription="Voeg je eerste gebruiker toe om te beginnen."
  pagination={data.pagination}
  onDelete={handleDelete}
  deleteLabel={user => user.username ?? 'deze gebruiker'}
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
      />
    </td>
  {/snippet}
</ListPage>
