<script lang="ts">
  import type { ComponentType, SvelteComponent } from 'svelte'

  interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: ComponentType<SvelteComponent<any>>
    title: string
    description?: string
    action?: { href: string; label: string }
  }

  let { icon: Icon, title, description, action }: Props = $props()
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
        href={action.href}
        class="btn mt-4 btn-primary">{action.label}</a
      >
    {/if}
  </div>
</div>
