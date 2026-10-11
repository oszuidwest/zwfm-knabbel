<script lang="ts">
  import FormField, { fieldA11y } from './FormField.svelte'

  interface Props {
    id: string
    label: string
    value: string
    error?: string
    rows?: number
    placeholder?: string
    hint?: string
    disabled?: boolean
  }

  let {
    id,
    label,
    value = $bindable(),
    error,
    rows = 4,
    placeholder,
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
  <textarea
    {id}
    {...fieldA11y(id, error, hint)}
    bind:value
    class={['textarea w-full resize-y leading-relaxed', error && 'textarea-error']}
    {rows}
    {placeholder}
    {disabled}></textarea>
</FormField>
