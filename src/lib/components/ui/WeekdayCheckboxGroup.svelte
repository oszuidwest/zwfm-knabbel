<script lang="ts">
  import { weekdayLabels } from '$lib/utils/labels'
  import type { Weekdays } from '$lib/types'

  interface Props {
    value: Weekdays
    label?: string
    disabled?: boolean
  }

  let { value = $bindable(), label = 'Dagen', disabled = false }: Props = $props()
</script>

<fieldset class="fieldset">
  <legend class="fieldset-legend">{label}</legend>
  <div class="flex flex-wrap gap-2">
    {#each Object.entries(weekdayLabels) as [key, dayLabel] (key)}
      <label class="label cursor-pointer gap-2">
        <input
          type="checkbox"
          bind:checked={value[key as keyof Weekdays]}
          class="checkbox checkbox-sm checkbox-primary"
          {disabled}
        />
        <span>{dayLabel}</span>
      </label>
    {/each}
  </div>
</fieldset>
