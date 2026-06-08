<script lang="ts">
  import './layout.css'
  import { page } from '$app/state'
  import { afterNavigate, goto } from '$app/navigation'
  import { untrack } from 'svelte'
  import { createAuthStore, setAuthContext } from '$lib/stores/auth.svelte'
  import Layout from '$lib/components/Layout.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import { toast } from '$lib/stores/toast'
  import { resolveInternalHref } from '$lib/utils/routes'
  import type { LayoutProps } from './$types'

  let { data, children }: LayoutProps = $props()
  const auth = createAuthStore(untrack(() => data.user))
  setAuthContext(auth)

  const publicRoutes = ['/login', '/auth/oauth/callback']

  const currentPathname = $derived(page.url.pathname)
  const isPublic = $derived(isPublicRoute(currentPathname))
  const isSessionExpiredLogin = $derived(
    currentPathname === '/login' && page.url.searchParams.get('expired') === '1'
  )
  const isAuthenticatedLoginRedirect = $derived(
    !!auth.user && currentPathname === '/login' && !isSessionExpiredLogin
  )

  function isPublicRoute(pathname: string): boolean {
    return publicRoutes.some(r => pathname.startsWith(r))
  }

  $effect(() => {
    auth.hydrate(data.user)
  })

  $effect(() => {
    if (!auth.checked || auth.user || isPublic) return
    void goto(resolveInternalHref('/login'))
  })

  $effect(() => {
    if (!auth.checked || !isSessionExpiredLogin || !auth.user) return
    auth.hydrate(null)
  })

  $effect(() => {
    if (!auth.checked || !isAuthenticatedLoginRedirect) return
    void goto(resolveInternalHref('/stories'))
  })

  async function guardRoute(pathname: string): Promise<void> {
    if (!auth.checked) return

    if (!auth.user && !isPublicRoute(pathname)) {
      await goto(resolveInternalHref('/login'))
    }
  }

  afterNavigate(({ to }) => {
    if (to?.url.searchParams.get('denied') === '1') {
      toast.error('Geen rechten voor deze pagina')
      void goto(resolveInternalHref('/stories'), { replaceState: true })
      return
    }

    void guardRoute(to?.url.pathname ?? page.url.pathname)
  })
</script>

<svelte:head>
  <title>Babbel - Nieuwsbulletinsysteem</title>
</svelte:head>

{#if auth.loading || isAuthenticatedLoginRedirect}
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <span class="loading loading-lg loading-spinner text-primary"></span>
  </div>
{:else if auth.user && !isSessionExpiredLogin}
  <Layout>
    {@render children()}
  </Layout>
{:else if isPublic}
  {@render children()}
{:else}
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <span class="loading loading-lg loading-spinner text-primary"></span>
  </div>
{/if}

<Toast />
