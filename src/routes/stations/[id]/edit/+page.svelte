<script lang="ts">
  import StationEditForm from './StationEditForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

{#key data.station.id}
  <StationEditForm {data} />
{/key}
