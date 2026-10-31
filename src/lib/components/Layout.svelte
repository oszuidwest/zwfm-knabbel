<script lang="ts">
  import type { Snippet } from 'svelte'
  import { navigating, page } from '$app/state'
  import { goto, invalidate } from '$app/navigation'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { AUTH_DEPENDENCY } from '$lib/auth/session'
  import { getRoleLabel } from '$lib/utils/labels'
  import { resolveInternalHref } from '$lib/utils/routes'
  import {
    Radio,
    Mic,
    BookOpen,
    FileText,
    Podcast,
    Users,
    LogOut,
    Menu,
    AudioWaveform,
    AudioLines,
  } from './icons'

  let { children }: { children: Snippet } = $props()
  const auth = getAuthContext()

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

  const speechNavItems: NavItem[] = [
    { path: '/pronunciations', label: 'Uitspraakregels', icon: BookOpen },
    { path: '/speech-generation', label: 'Spraakgeneratie', icon: AudioLines },
  ]

  const adminNavItems: NavItem[] = [{ path: '/users', label: 'Gebruikers', icon: Users }]
  const activePathname = $derived(navigating.to?.url.pathname ?? page.url.pathname)

  function isActive(path: string): boolean {
    return activePathname === path || activePathname.startsWith(`${path}/`)
  }

  async function handleLogout(): Promise<void> {
    await auth.logout()
    await invalidate(AUTH_DEPENDENCY)
    await goto(resolveInternalHref('/login'))
  }
</script>

{#snippet navLink(item: NavItem)}
  {@const Icon = item.icon}
  <li>
    <a
      href={resolveInternalHref(item.path)}
      aria-current={isActive(item.path) ? 'page' : undefined}
    >
      <Icon
        aria-hidden="true"
        class="size-4.5"
      />
      {item.label}
    </a>
  </li>
{/snippet}

<div class="drawer lg:drawer-open">
  <input
    id="drawer-toggle"
    type="checkbox"
    class="drawer-toggle"
    aria-label="Menu"
  />

  <div class="drawer-content flex min-h-screen flex-col">
    <div class="navbar bg-base-100 lg:hidden">
      <div class="flex-none">
        <label
          for="drawer-toggle"
          class="btn btn-square btn-ghost drawer-button"
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
          href={resolveInternalHref('/')}
          class="btn gap-3 btn-ghost text-xl font-semibold"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <AudioWaveform
              aria-hidden="true"
              class="h-6 w-6 text-primary-content"
            />
          </div>
          Babbel
        </a>
      </div>
    </div>

    <main class="flex-1 bg-base-200">
      <div class="p-4 lg:p-8">
        {@render children()}
      </div>
    </main>
  </div>

  <div class="drawer-side">
    <label
      for="drawer-toggle"
      class="drawer-overlay"
      aria-label="Menu sluiten"
    ></label>
    <aside class="flex min-h-full w-68 flex-col bg-base-100">
      <div class="border-b border-base-300 px-5 py-5">
        <a
          href={resolveInternalHref('/')}
          class="flex items-center gap-3"
        >
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary">
            <AudioWaveform
              aria-hidden="true"
              class="h-7 w-7 text-primary-content"
            />
          </div>
          <div>
            <h1 class="page-title">Babbel</h1>
            <p class="page-subtitle">Nieuwsbulletinsysteem</p>
          </div>
        </a>
      </div>

      <nav class="flex-1 p-3">
        <ul class="menu w-full gap-0.5 menu-md [&_a]:rounded-lg">
          <li class="menu-title">Menu</li>
          {#each mainNavItems as item (item.path)}
            {@render navLink(item)}
          {/each}

          {#if auth.can('pronunciation_rules', 'read') || auth.can('settings:tts', 'read')}
            <li class="mt-4 menu-title">Spraak</li>
            {#each speechNavItems as item (item.path)}
              {@render navLink(item)}
            {/each}
          {/if}

          {#if auth.can('users', 'read')}
            <li class="mt-4 menu-title">Beheer</li>
            {#each adminNavItems as item (item.path)}
              {@render navLink(item)}
            {/each}
          {/if}
        </ul>
      </nav>

      <div class="border-t border-base-300 px-5 py-3">
        <div class="flex items-center gap-3">
          <div class="avatar avatar-placeholder">
            <div class="w-9 rounded-full bg-primary text-sm text-primary-content">
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
