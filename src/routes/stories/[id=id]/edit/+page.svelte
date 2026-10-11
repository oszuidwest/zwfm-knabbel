<script lang="ts">
  import StoryEditForm from './StoryEditForm.svelte'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
</script>

{#key data.story.id}
  <StoryEditForm {data} />
{/key}
