<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/stories')
  })
</script>

<div class="flex min-h-screen items-center justify-center">
  <span class="loading loading-lg loading-spinner"></span>
</div>
