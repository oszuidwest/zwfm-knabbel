<script lang="ts">
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import { authApi } from '$lib/api/auth'
  import { toast } from '$lib/stores/toast'

  let status = $state<'loading' | 'success' | 'error'>('loading')
  let errorMessage = $state('')

  function redirectToLogin(message: string): () => void {
    status = 'error'
    errorMessage = message
    toast.error(message)
    const timer = setTimeout(() => goto('/login'), 3000)
    return () => clearTimeout(timer)
  }

  onMount(() => {
    let cleanup: (() => void) | undefined

    async function handleCallback(): Promise<void> {
      const code = $page.url.searchParams.get('code')
      const state = $page.url.searchParams.get('state')
      const error = $page.url.searchParams.get('error')
      const errorDescription = $page.url.searchParams.get('error_description')

      if (error) {
        cleanup = redirectToLogin(errorDescription || error || 'Authenticatie mislukt')
        return
      }

      if (!code || !state) {
        cleanup = redirectToLogin('Ongeldige callback parameters')
        return
      }

      try {
        await authApi.oauthCallback(code, state)
        const authenticated = await auth.checkAuth()

        if (authenticated) {
          status = 'success'
          toast.success('Succesvol ingelogd')
          goto('/stories')
        } else {
          throw new Error('Authenticatie verificatie mislukt')
        }
      } catch (err) {
        cleanup = redirectToLogin(err instanceof Error ? err.message : 'Authenticatie mislukt')
      }
    }

    handleCallback()

    return () => cleanup?.()
  })
</script>

<div class="flex min-h-screen items-center justify-center bg-base-200">
  <div class="card w-full max-w-md bg-base-100">
    <div class="card-body items-center text-center">
      {#if status === 'loading'}
        <span class="loading loading-lg loading-spinner text-primary"></span>
        <h2 class="mt-4 card-title">Bezig met inloggen...</h2>
        <p class="page-subtitle">Even geduld terwijl we je authenticatie verwerken.</p>
      {:else if status === 'success'}
        <div class="mb-4 text-5xl text-success">✓</div>
        <h2 class="card-title">Ingelogd!</h2>
        <p class="page-subtitle">Je wordt doorgestuurd...</p>
      {:else if status === 'error'}
        <div class="mb-4 text-5xl text-error">✗</div>
        <h2 class="card-title">Inloggen mislukt</h2>
        <p class="page-subtitle">{errorMessage}</p>
        <p class="page-subtitle mt-2">Je wordt doorgestuurd naar de login pagina...</p>
      {/if}
    </div>
  </div>
</div>
