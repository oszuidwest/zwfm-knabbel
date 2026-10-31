<script lang="ts">
  import { page } from '$app/state'
  import { goto, invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { getAuthContext } from '#lib/stores/auth.svelte.js'
  import { AUTH_DEPENDENCY } from '#lib/auth/session.js'
  import { getAuthOauthCallback } from '#lib/api/generated/sdk.gen.js'
  import { toast } from '#lib/stores/toast.js'
  import { resolveInternalHref } from '#lib/utils/routes.js'
  import { CircleAlert, CircleCheckBig } from '#lib/components/icons.js'

  let status = $state<'loading' | 'success' | 'error'>('loading')
  let errorMessage = $state('')
  const auth = getAuthContext()

  function redirectToLogin(message: string): () => void {
    status = 'error'
    errorMessage = message
    toast.error(message)
    const timer = setTimeout(() => goto(resolveInternalHref('/login')), 3000)
    return () => clearTimeout(timer)
  }

  onMount(() => {
    let cleanup: (() => void) | undefined

    async function handleCallback(): Promise<void> {
      const code = page.url.searchParams.get('code')
      const state = page.url.searchParams.get('state')
      const error = page.url.searchParams.get('error')
      const errorDescription = page.url.searchParams.get('error_description')

      if (error) {
        cleanup = redirectToLogin(errorDescription || error || 'Authenticatie mislukt')
        return
      }

      if (!code || !state) {
        cleanup = redirectToLogin('Ongeldige callback parameters')
        return
      }

      try {
        await getAuthOauthCallback({ query: { code, state } })
        const authenticated = await auth.checkAuth({ force: true })

        if (authenticated) {
          await invalidate(AUTH_DEPENDENCY)
          status = 'success'
          toast.success('Succesvol ingelogd')
          goto(resolveInternalHref('/stories'))
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

<svelte:head>
  <title>Inloggen · Babbel</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
  <div class="card w-full max-w-md bg-base-100">
    <div class="card-body items-center text-center">
      {#if status === 'loading'}
        <span class="loading loading-lg loading-spinner text-primary"></span>
        <h2 class="mt-4 card-title">Bezig met inloggen…</h2>
        <p class="page-subtitle">Even geduld terwijl we je authenticatie verwerken.</p>
      {:else if status === 'success'}
        <CircleCheckBig
          aria-hidden="true"
          class="mb-4 h-10 w-10 text-success"
        />
        <h2 class="card-title">Ingelogd</h2>
        <p class="page-subtitle">Je wordt doorgestuurd…</p>
      {:else if status === 'error'}
        <CircleAlert
          aria-hidden="true"
          class="mb-4 h-10 w-10 text-error"
        />
        <h2 class="card-title">Inloggen mislukt</h2>
        <p class="page-subtitle">{errorMessage}</p>
        <p class="page-subtitle mt-2">Je wordt doorgestuurd naar de inlogpagina…</p>
      {/if}
    </div>
  </div>
</div>
