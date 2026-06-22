<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Plus } from '$lib/components/icons'
  import { resolveInternalHref } from '$lib/utils/routes'
  import MaybeTooltip from './MaybeTooltip.svelte'

  interface Props {
    title: string
    subtitle?: string
    actionHref?: string
    actionLabel?: string
    canAction?: boolean
    forbidTooltip?: string
    actions?: Snippet
  }

  let {
    title,
    subtitle,
    actionHref,
    actionLabel,
    canAction = true,
    forbidTooltip = 'Geen rechten',
    actions,
  }: Props = $props()

  const resolvedActionHref = $derived(actionHref ? resolveInternalHref(actionHref) : undefined)

  function handleActionClick(e: MouseEvent): void {
    if (!canAction) {
      e.preventDefault()
    }
  }
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
    <MaybeTooltip
      when={!canAction}
      tip={forbidTooltip}
      wrapperClass="max-md:hidden"
    >
      <a
        href={canAction ? resolvedActionHref : undefined}
        class={['btn btn-primary', !canAction && 'btn-disabled']}
        role={canAction ? undefined : 'button'}
        aria-disabled={!canAction}
        tabindex={canAction ? undefined : -1}
        onclick={handleActionClick}
      >
        <Plus
          aria-hidden="true"
          class="h-5 w-5"
        />
        {actionLabel ?? 'Nieuw'}
      </a>
    </MaybeTooltip>
  {/if}
</div>
