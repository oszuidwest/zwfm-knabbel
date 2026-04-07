<script lang="ts">
  /**
   * Select input component with strict string typing.
   *
   * HTML <select> elements always return string values, so this component
   * enforces string types for both value and options. Use the form helpers
   * from $lib/utils/form.ts for number ↔ string conversion.
   */

  import FormField from './FormField.svelte'

  interface Option {
    value: string
    label: string
  }

  interface Props {
    id: string
    label: string
    /** Value is always a string (HTML select behavior). Use toStringOrEmpty/toNumberOrNull for conversion. */
    value: string | null | undefined
    options: Option[]
    error?: string
    /**
     * Disabled placeholder option shown when no value is selected.
     * Cannot be re-selected after choosing another option.
     * Use for required fields.
     */
    placeholder?: string
    /**
     * Selectable option that sets value to empty string.
     * Can be selected/deselected at any time.
     * Use for optional fields where "no selection" is valid.
     */
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
    bind:value
    class="select-bordered select w-full"
    class:select-error={error}
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
