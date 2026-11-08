<script>
  import { createAuthStore, setAuthContext } from '#lib/stores/auth.svelte.js'

  let { page: Page, data } = $props()
  setAuthContext(createAuthStore({ permissions: { stories: ['read', 'write'] } }))
</script>

<Page {data} />
