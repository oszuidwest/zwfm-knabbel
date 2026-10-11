<script lang="ts">
  import FormField, { fieldA11y } from './FormField.svelte'

  interface Option {
    value: string
    label: string
  }

  interface Props {
    id: string
    label: string
    value: string | null | undefined
    options: readonly Option[]
    error?: string
    /** Disabled option for required fields. */
    placeholder?: string
    /** Selectable empty value for optional fields. */
    emptyOption?: string
    hint?: string
    disabled?: boolean
  }

  let {
    id,
    label,
    value = $bindable(),
    options,
    error,
    placeholder,
    emptyOption,
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
  <select
    {id}
    {...fieldA11y(id, error, hint)}
    bind:value
    class={['select w-full', error && 'select-error']}
    {disabled}
  >
    {#if placeholder}
      <option
        value=""
        disabled>{placeholder}</option
      >
    {/if}
    {#if emptyOption}
      <option value="">{emptyOption}</option>
    {/if}
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</FormField>
