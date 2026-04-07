<script lang="ts">
  import { weekdayLabels } from '$lib/utils/labels'
  import type { Weekdays } from '$lib/types'

  interface Props {
    value: Weekdays
    label?: string
  }

  let { value = $bindable(), label = 'Dagen' }: Props = $props()
</script>

<fieldset class="form-control">
  <legend class="label-text mb-2">{label}</legend>
  <div class="flex flex-wrap gap-2">
    {#each Object.entries(weekdayLabels) as [key, dayLabel] (key)}
      <label class="label cursor-pointer gap-2">
        <input
          type="checkbox"
          bind:checked={value[key as keyof Weekdays]}
          class="checkbox checkbox-sm checkbox-primary"
        />
        <span class="label-text">{dayLabel}</span>
      </label>
    {/each}
  </div>
</fieldset>
