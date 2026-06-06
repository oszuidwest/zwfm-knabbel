<script lang="ts">
  import './layout.css'
  import { page } from '$app/state'
  import { afterNavigate, goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { createAuthStore, setAuthContext } from '$lib/stores/auth.svelte'
  import Layout from '$lib/components/Layout.svelte'
  import Toast from '$lib/components/Toast.svelte'
  import { resolveInternalHref } from '$lib/utils/routes'

  let { children } = $props()
  const auth = createAuthStore()
  setAuthContext(auth)

  const publicRoutes = ['/login', '/auth/oauth/callback']

  function getPagePathname(): string {
    return page.url.pathname
  }

  let currentPathname = $state(getPagePathname())
  const isPublic = $derived(isPublicRoute(currentPathname))
  const isAuthenticatedLoginRedirect = $derived(!!auth.user && currentPathname === '/login')

  function isPublicRoute(pathname: string): boolean {
    return publicRoutes.some(r => pathname.startsWith(r))
  }

  async function guardRoute(pathname: string): Promise<void> {
    if (!auth.checked) return

    if (!auth.user && !isPublicRoute(pathname)) {
      await goto(resolveInternalHref('/login'))
    } else if (auth.user && pathname === '/login') {
      await goto(resolveInternalHref('/stories'))
    }
  }

  onMount(async () => {
    await auth.checkAuth()
    await guardRoute(page.url.pathname)
  })

  afterNavigate(({ to }) => {
    // Update after navigation commits so the shell follows the rendered route.
    currentPathname = to?.url.pathname ?? getPagePathname()
    void guardRoute(currentPathname)
  })
</script>

<svelte:head>
  <title>Babbel - Nieuwsbulletinsysteem</title>
</svelte:head>

{#if auth.loading || isAuthenticatedLoginRedirect}
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <span class="loading loading-lg loading-spinner text-primary"></span>
  </div>
{:else if auth.user}
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
