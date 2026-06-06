<script lang="ts">
  import type { Component } from 'svelte'
  import { resolveInternalHref } from '$lib/utils/routes'

  interface Props {
    icon: Component
    title: string
    description?: string
    action?: { href: string; label: string }
  }

  let { icon: Icon, title, description, action }: Props = $props()

  const resolvedActionHref = $derived(action ? resolveInternalHref(action.href) : undefined)
</script>

<div class="card bg-base-100">
  <div class="card-body items-center py-12 text-center">
    <Icon
      aria-hidden="true"
      class="mb-4 h-12 w-12 text-base-content/30"
    />
    <h3 class="section-title">{title}</h3>
    {#if description}
      <p class="page-subtitle">{description}</p>
    {/if}
    {#if action}
      <a
        href={resolvedActionHref}
        class="btn mt-4 btn-primary">{action.label}</a
      >
    {/if}
  </div>
</div>
