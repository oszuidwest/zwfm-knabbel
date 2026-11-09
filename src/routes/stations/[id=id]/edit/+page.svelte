<script lang="ts">
  import StationForm from '../../StationForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

{#key data.station.id}
  <StationForm station={data.station} />
{/key}
