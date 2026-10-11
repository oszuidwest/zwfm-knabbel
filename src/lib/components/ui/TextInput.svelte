<script lang="ts">
  import FormField, { fieldA11y } from './FormField.svelte'

  interface Props {
    id: string
    label: string
    value?: string
    error?: string
    placeholder?: string
    type?: 'text' | 'email' | 'password' | 'date'
    hint?: string
    disabled?: boolean
  }

  let {
    id,
    label,
    value = $bindable(''),
    error,
    placeholder,
    type = 'text',
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
    {type}
    bind:value
    class={['input w-full', error && 'input-error']}
    {placeholder}
    {disabled}
  />
</FormField>
