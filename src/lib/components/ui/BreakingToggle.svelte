<script lang="ts">
  import { Zap } from '$lib/components/icons'

  interface Props {
    checked: boolean
  }

  let { checked = $bindable() }: Props = $props()
</script>

<div
  class="tooltip tooltip-bottom"
  data-tip="Wordt in elk bulletin opgenomen"
>
  <button
    type="button"
    class="btn join-item {checked ? 'btn-primary' : 'btn-soft'}"
    onclick={() => (checked = !checked)}
    aria-label="Schakel breaking nieuws in/uit"
  >
    <Zap
      class="h-4 w-4 {checked ? 'fill-current' : ''}"
      aria-hidden="true"
    />
    Breaking
  </button>
</div>
