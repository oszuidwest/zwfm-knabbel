<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Plus } from '$lib/components/icons'

  interface Props {
    title: string
    subtitle?: string
    actionHref?: string
    actionLabel?: string
    actions?: Snippet
  }

  let { title, subtitle, actionHref, actionLabel, actions }: Props = $props()
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 class="page-title">{title}</h1>
    {#if subtitle}
      <p class="page-subtitle">{subtitle}</p>
    {/if}
  </div>
  {#if actions}
    {@render actions()}
  {:else if actionHref}
    <a
      href={actionHref}
      class="btn btn-primary max-md:hidden"
    >
      <Plus
        aria-hidden="true"
        class="h-5 w-5"
      />
      {actionLabel ?? 'Nieuw'}
    </a>
  {/if}
</div>
