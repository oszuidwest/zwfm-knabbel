<script lang="ts">
  import UserForm from '../../UserForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

{#key data.user.id}
  <UserForm user={data.user} />
{/key}
