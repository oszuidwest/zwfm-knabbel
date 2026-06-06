<script lang="ts">
  import VoiceEditForm from './VoiceEditForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

{#key data.voice.id}
  <VoiceEditForm {data} />
{/key}
