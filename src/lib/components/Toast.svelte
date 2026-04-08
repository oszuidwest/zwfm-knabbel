<script lang="ts">
  import { toast } from '$lib/stores/toast'
  import { CircleCheckBig, CircleAlert, TriangleAlert, Info, X } from './icons'

  const iconMap = {
    success: CircleCheckBig,
    error: CircleAlert,
    warning: TriangleAlert,
    info: Info,
  }

  const alertClass = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  }
</script>

<div class="toast toast-end z-50">
  {#each $toast as t (t.id)}
    {@const Icon = iconMap[t.type]}
    <div class="alert {alertClass[t.type]}">
      <Icon class="h-5 w-5" />
      <span>{t.message}</span>
      <button
        class="btn btn-ghost btn-xs"
        onclick={() => toast.remove(t.id)}
        aria-label="Sluiten"
      >
        <X
          class="h-4 w-4"
          aria-hidden="true"
        />
      </button>
    </div>
  {/each}
</div>
