<script lang="ts">
  import FormField from './FormField.svelte'

  interface Props {
    id: string
    label: string
    value: number
    error?: string
    min?: number
    max?: number
    step?: number
    hint?: string
    disabled?: boolean
  }

  let {
    id,
    label,
    value = $bindable(),
    error,
    min,
    max,
    step,
    hint,
    disabled = false,
  }: Props = $props()
</script>

<FormField
  {id}
  {label}
  {error}
  {hint}
>
  <input
    {id}
    type="number"
    bind:value
    class="input-bordered input w-full"
    class:input-error={error}
    {min}
    {max}
    {step}
    {disabled}
  />
</FormField>
