<script lang="ts">
  import FormField, { fieldA11y } from './FormField.svelte'

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
    {...fieldA11y(id, error, hint)}
    type="number"
    bind:value
    class={['input w-full', error && 'input-error']}
    {min}
    {max}
    {step}
    {disabled}
  />
</FormField>
