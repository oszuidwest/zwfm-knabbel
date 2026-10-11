<script lang="ts">
  import UserEditForm from './UserEditForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

{#key data.user.id}
  <UserEditForm {data} />
{/key}
