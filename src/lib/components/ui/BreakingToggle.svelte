<script lang="ts">
  import { Zap } from '$lib/components/icons'

  interface Props {
    checked: boolean
    disabled?: boolean
  }

  let { checked = $bindable(), disabled = false }: Props = $props()

  function toggle(): void {
    if (disabled) return
    checked = !checked
  }
</script>

<div
  class="tooltip tooltip-bottom"
  data-tip="Wordt in elk bulletin opgenomen"
>
  <button
    type="button"
    class="btn join-item {checked ? 'btn-primary' : 'btn-soft'}"
    onclick={toggle}
    {disabled}
    aria-label="Schakel breaking nieuws in/uit"
  >
    <Zap
      class="h-4 w-4 {checked ? 'fill-current' : ''}"
      aria-hidden="true"
    />
    Breaking
  </button>
</div>
