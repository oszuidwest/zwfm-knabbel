<script lang="ts">
  import FormField from './FormField.svelte'

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
    bind:value
    class="textarea-bordered textarea w-full resize-y leading-relaxed"
    class:textarea-error={error}
    {rows}
    {placeholder}
    {disabled}
  ></textarea>
</FormField>
