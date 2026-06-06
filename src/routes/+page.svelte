<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { resolveInternalHref } from '$lib/utils/routes'

  onMount(() => {
    goto(resolveInternalHref('/stories'))
  })
</script>

<div class="flex min-h-screen items-center justify-center">
  <span class="loading loading-lg loading-spinner"></span>
</div>
