<script lang="ts">
  import FormField from './FormField.svelte'

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
    {type}
    bind:value
    class="input-bordered input w-full"
    class:input-error={error}
    {placeholder}
    {disabled}
  />
</FormField>
