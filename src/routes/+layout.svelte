<script lang="ts">
  import './layout.css'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { auth } from '$lib/stores/auth.svelte'
  import Layout from '$lib/components/Layout.svelte'
  import Toast from '$lib/components/Toast.svelte'

  let { children } = $props()

  const publicRoutes = ['/login', '/auth/oauth/callback']

  function isPublicRoute(pathname: string): boolean {
    return publicRoutes.some(r => pathname.startsWith(r))
  }

  onMount(async () => {
    await auth.checkAuth()
  })

  $effect(() => {
    if (!auth.checked) return

    const pathname = $page.url.pathname
    const isPublic = isPublicRoute(pathname)

    if (!auth.user && !isPublic) {
      goto('/login')
    } else if (auth.user && pathname === '/login') {
      goto('/stories')
    }
  })
</script>

<svelte:head>
  <title>Babbel - Nieuwsbulletinsysteem</title>
</svelte:head>

{#if auth.loading}
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <span class="loading loading-lg loading-spinner text-primary"></span>
  </div>
{:else if auth.user}
  <Layout>
    {@render children()}
  </Layout>
{:else if isPublicRoute($page.url.pathname)}
  {@render children()}
{:else}
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <span class="loading loading-lg loading-spinner text-primary"></span>
  </div>
{/if}

<Toast />
