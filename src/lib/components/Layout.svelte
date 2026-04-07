<script lang="ts">
  import type { Snippet } from 'svelte'
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { auth } from '$lib/stores/auth.svelte'
  import { getRoleLabel } from '$lib/utils/labels'
  import { Radio, Mic, FileText, Podcast, Users, LogOut, Menu, AudioWaveform } from './icons'

  let { children }: { children: Snippet } = $props()

  interface NavItem {
    path: string
    label: string
    icon: typeof Radio
  }

  const mainNavItems: NavItem[] = [
    { path: '/stations', label: 'Zenders', icon: Radio },
    { path: '/voices', label: 'Stemmen', icon: Mic },
    { path: '/stories', label: 'Berichten', icon: FileText },
    { path: '/bulletins', label: 'Bulletins', icon: Podcast },
  ]

  const adminNavItems: NavItem[] = [{ path: '/users', label: 'Gebruikers', icon: Users }]

  function isActive(path: string): boolean {
    return $page.url.pathname === path || $page.url.pathname.startsWith(`${path}/`)
  }

  async function handleLogout(): Promise<void> {
    await auth.logout()
    goto('/login')
  }
</script>

<div class="drawer lg:drawer-open">
  <input
    id="drawer-toggle"
    type="checkbox"
    class="drawer-toggle"
  />

  <div class="drawer-content flex flex-col">
    <!-- Mobile navbar -->
    <div class="navbar bg-base-100 lg:hidden">
      <div class="flex-none">
        <label
          for="drawer-toggle"
          class="drawer-button btn btn-square btn-ghost"
          aria-label="Open menu"
        >
          <Menu
            aria-hidden="true"
            class="h-5 w-5"
          />
        </label>
      </div>
      <div class="flex-1">
        <a
          href="/"
          class="btn gap-2 text-xl font-bold normal-case btn-ghost"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80"
          >
            <AudioWaveform
              aria-hidden="true"
              class="h-6 w-6 text-primary-content"
            />
          </div>
          Babbel
        </a>
      </div>
    </div>

    <!-- Page content -->
    <main class="min-h-screen flex-1 bg-base-200">
      <div class="p-4 lg:p-8">
        {@render children()}
      </div>
    </main>
  </div>

  <div class="drawer-side">
    <label
      for="drawer-toggle"
      class="drawer-overlay"
    ></label>
    <aside class="flex min-h-full w-80 flex-col bg-base-100">
      <!-- Logo -->
      <div class="border-b border-base-300 p-6">
        <a
          href="/"
          class="flex items-center gap-4"
        >
          <div
            class="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80"
          >
            <AudioWaveform
              aria-hidden="true"
              class="h-8 w-8 text-primary-content"
            />
          </div>
          <div>
            <h1 class="page-title">Babbel</h1>
            <p class="page-subtitle">Nieuwsbulletinsysteem</p>
          </div>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-5">
        <ul class="menu gap-2 menu-md [&_a]:rounded-lg">
          <li class="menu-title tracking-widest uppercase">Menu</li>
          {#each mainNavItems as item (item.path)}
            {@const Icon = item.icon}
            <li>
              <a
                href={item.path}
                class:menu-active={isActive(item.path)}
              >
                <Icon
                  aria-hidden="true"
                  class="h-6 w-6"
                />
                {item.label}
              </a>
            </li>
          {/each}

          <!-- Admin section -->
          {#if auth.isAdmin}
            <li class="mt-4 menu-title tracking-widest uppercase">Admin</li>
            {#each adminNavItems as item (item.path)}
              {@const Icon = item.icon}
              <li>
                <a
                  href={item.path}
                  class:menu-active={isActive(item.path)}
                >
                  <Icon
                    aria-hidden="true"
                    class="h-6 w-6"
                  />
                  {item.label}
                </a>
              </li>
            {/each}
          {/if}
        </ul>
      </nav>

      <!-- User info -->
      <div class="border-t border-base-300 p-4">
        <div class="flex items-center gap-3">
          <div class="avatar-online avatar avatar-placeholder">
            <div class="w-10 rounded-full bg-primary text-primary-content">
              <span>{(auth.user?.full_name || auth.user?.username)?.[0]?.toUpperCase() || '?'}</span
              >
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {auth.user?.full_name || auth.user?.username || 'Gebruiker'}
            </p>
            <p class="text-xs text-base-content/60">
              {getRoleLabel(auth.user?.role)}
            </p>
          </div>
          <div
            class="tooltip tooltip-left"
            data-tip="Uitloggen"
          >
            <button
              onclick={handleLogout}
              class="btn btn-square btn-ghost btn-sm"
              aria-label="Uitloggen"
            >
              <LogOut
                aria-hidden="true"
                class="h-4 w-4"
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</div>
