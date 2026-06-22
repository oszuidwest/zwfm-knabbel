<script lang="ts">
  /**
   * SelectInput keeps HTML select values explicitly typed as strings.
   *
   * Use the form helpers from $lib/utils/form.ts for number ↔ string conversion
   * at API boundaries.
   */

  import FormField from './FormField.svelte'

  interface Option {
    value: string
    label: string
  }

  interface Props {
    id: string
    label: string
    /** value stays string-compatible because HTML select values are strings. */
    value: string | null | undefined
    options: readonly Option[]
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
