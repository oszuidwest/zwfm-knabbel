<script lang="ts">
  import { tick } from 'svelte'
  import { beforeNavigate, invalidateAll } from '$app/navigation'
  import { ApiError, isProblemDetails, notifyMutationError } from '$lib/api/client'
  import { settingsApi } from '$lib/api/settings'
  import {
    isPronunciationRuleField,
    pronunciationRulesSchema,
    type PronunciationRuleField,
  } from '$lib/schemas/pronunciations'
  import { toast } from '$lib/stores/toast'
  import { EmptyState, MaybeTooltip, PageHeader } from '$lib/components/ui'
  import {
    BookOpen,
    Check,
    Info,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    TriangleAlert,
  } from '$lib/components/icons'
  import {
    type PronunciationRule,
    type PronunciationRulesList,
    type PronunciationRulesUpdate,
  } from '$lib/types'

  interface Props {
    initial: PronunciationRulesList
    canEdit: boolean
  }

  let { initial, canEdit }: Props = $props()

  interface DraftRow {
    readonly _key: number
    string_to_replace: string
    ipa: string
    case_sensitive: boolean
    word_boundaries: boolean
  }

  type RowErrors = Record<number, Partial<Record<PronunciationRuleField, string>>>

  const SERVER_RULE_ERROR_RE = /^rules\[(\d+)\]\.(\w+)$/

  let nextKey = 1
  const makeDraft = (r: PronunciationRule): DraftRow => ({
    _key: nextKey++,
    string_to_replace: r.string_to_replace,
    ipa: r.ipa,
    case_sensitive: r.case_sensitive,
    word_boundaries: r.word_boundaries,
  })

  const toPayload = (drafts: DraftRow[]): PronunciationRulesUpdate['rules'] =>
    drafts.map(r => ({
      string_to_replace: r.string_to_replace.trim(),
      ipa: r.ipa.trim(),
      case_sensitive: r.case_sensitive,
      word_boundaries: r.word_boundaries,
    }))

  function initialDraftState(): {
    snapshot: DraftRow[]
    rows: DraftRow[]
  } {
    const initialSnapshot = initial.rules.map(makeDraft)

    return {
      snapshot: initialSnapshot,
      rows: structuredClone(initialSnapshot),
    }
  }

  function draftsEqual(a: DraftRow[], b: DraftRow[]): boolean {
    if (a.length !== b.length) return false

    return a.every((row, index) => {
      const other = b[index]
      return (
        row.string_to_replace.trim() === other.string_to_replace.trim() &&
        row.ipa.trim() === other.ipa.trim() &&
        row.case_sensitive === other.case_sensitive &&
        row.word_boundaries === other.word_boundaries
      )
    })
  }

  const draftState = initialDraftState()
  let snapshot = $state.raw<DraftRow[]>(draftState.snapshot)
  let rows = $state<DraftRow[]>(draftState.rows)
  let rowErrors = $state<RowErrors>({})
  let globalError = $state<string | null>(null)
  let submitting = $state(false)
  let search = $state('')

  const editable = $derived(canEdit)
  const disabledTooltip = 'Geen rechten'
  const inlineIpaHint =
    'Vul alleen de IPA-klanken in, zonder schuine strepen. De app zet de /.../ automatisch om de klanken heen.'

  const isDirty = $derived(!draftsEqual(rows, snapshot))
  const saveDisabled = $derived(!editable || !isDirty || submitting)
  const reloadLabel = $derived(isDirty ? 'Wijzigingen verwerpen' : 'Herladen')

  const filteredRows = $derived.by(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      r => r.string_to_replace.toLowerCase().includes(q) || r.ipa.toLowerCase().includes(q)
    )
  })

  const countLabel = $derived(`${rows.length} ${rows.length === 1 ? 'regel' : 'regels'}`)

  function focusRowWordInput(key: number): void {
    const inputs = [`row-${key}-word`, `m-row-${key}-word`]
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement)

    const input = inputs.find(el => el.getClientRects().length > 0) ?? inputs[0]
    input?.focus()
  }

  function applyRulesList(list: PronunciationRulesList): void {
    snapshot = list.rules.map(makeDraft)
    rows = structuredClone(snapshot)
    rowErrors = {}
    globalError = null
    search = ''
  }

  function resetToSnapshot(): void {
    rows = structuredClone(snapshot)
    rowErrors = {}
    globalError = null
    search = ''
  }

  async function handleAddRow(): Promise<void> {
    if (!editable) return
    const key = nextKey++
    search = ''
    rows = [
      ...rows,
      {
        _key: key,
        string_to_replace: '',
        ipa: '',
        case_sensitive: true,
        word_boundaries: true,
      },
    ]
    await tick()
    focusRowWordInput(key)
  }

  function handleRemoveRow(key: number): void {
    if (!editable) return
    rows = rows.filter(r => r._key !== key)
    if (rowErrors[key]) {
      const { [key]: _removed, ...rest } = rowErrors
      rowErrors = rest
    }
  }

  function clearRowError(key: number, field: PronunciationRuleField): void {
    const current = rowErrors[key]
    if (!current?.[field]) return
    const { [field]: _removed, ...rest } = current
    if (Object.keys(rest).length === 0) {
      const { [key]: _gone, ...others } = rowErrors
      rowErrors = others
    } else {
      rowErrors = { ...rowErrors, [key]: rest }
    }
  }

  async function handleSave(): Promise<void> {
    if (submitting || !editable) return
    rowErrors = {}
    globalError = null

    const payload = toPayload(rows)
    const parsed = pronunciationRulesSchema.safeParse({ rules: payload })
    if (!parsed.success) {
      const nextErrors: RowErrors = {}
      let hasRowErrors = false
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'rules' && typeof issue.path[1] === 'number') {
          const row = rows[issue.path[1]]
          const field = issue.path[2]
          if (row && typeof field === 'string' && isPronunciationRuleField(field)) {
            nextErrors[row._key] = { ...nextErrors[row._key], [field]: issue.message }
            hasRowErrors = true
          } else {
            globalError = issue.message
          }
        } else {
          globalError = issue.message
        }
      }
      rowErrors = nextErrors
      if (hasRowErrors) search = ''
      toast.error('Controleer de fouten in het formulier')
      return
    }

    if (payload.length === 0 && snapshot.length > 0) {
      if (!confirm('Weet je zeker dat je ALLE uitspraakregels wilt verwijderen?')) {
        return
      }
    }

    submitting = true
    try {
      let saved: PronunciationRulesList
      try {
        saved = await settingsApi.updateTtsPronunciations({ rules: payload })
      } catch (err) {
        handleSaveError(err)
        return
      }

      applyRulesList(saved)
      toast.success('Uitspraakregels opgeslagen')

      try {
        await invalidateAll()
      } catch (err) {
        console.error('[pronunciations] refresh after save failed', err)
        toast.warning('Opgeslagen, maar vernieuwen mislukt')
      }
    } finally {
      submitting = false
    }
  }

  function handleSaveError(err: unknown): void {
    if (!(err instanceof ApiError)) {
      console.error('[pronunciations] unexpected save error', err)
      toast.error('Opslaan mislukt')
      return
    }

    const details = isProblemDetails(err.details) ? err.details : undefined

    if ((err.status === 400 || err.status === 422) && details?.errors?.length) {
      const nextErrors: RowErrors = {}
      const globalMessages: string[] = []
      const addGlobalMessage = (message: string): void => {
        if (!globalMessages.includes(message)) {
          globalMessages.push(message)
        }
      }
      for (const e of details.errors) {
        const message = e.message ?? details.detail ?? 'De server heeft een veldfout teruggegeven'
        if (!e.field) {
          addGlobalMessage(message)
          continue
        }

        const m = SERVER_RULE_ERROR_RE.exec(e.field)
        if (!m) {
          addGlobalMessage(message)
          continue
        }
        const idx = Number(m[1])
        const field = m[2]
        const row = rows[idx]
        if (row && isPronunciationRuleField(field)) {
          nextErrors[row._key] = { ...nextErrors[row._key], [field]: message }
        } else {
          addGlobalMessage(message)
        }
      }
      rowErrors = nextErrors
      if (globalMessages.length > 0) {
        globalError = globalMessages.join(' ')
      }
      search = ''
      toast.error(
        globalMessages.length > 0
          ? 'De server heeft fouten gevonden'
          : 'De server heeft fouten gevonden — zie de rijen.'
      )
      return
    }

    if (err.status === 413) {
      globalError = details?.detail ?? 'De lijst met uitspraakregels is te groot.'
      toast.error(globalError)
      return
    }
    if (err.status === 503) {
      globalError =
        details?.detail ?? details?.hint ?? 'Uitspraakregels zijn tijdelijk niet beschikbaar'
      toast.error(globalError)
      return
    }
    notifyMutationError(err, 'Opslaan mislukt')
  }

  async function reloadOrDiscard(): Promise<void> {
    if (isDirty && !confirm('Onopgeslagen wijzigingen verwerpen en opnieuw laden?')) return
    if (isDirty) resetToSnapshot()
    try {
      await invalidateAll()
      await tick()
      applyRulesList(initial)
    } catch (err) {
      console.error('[pronunciations] reload failed', err)
      toast.error('Herladen mislukt')
    }
  }

  beforeNavigate(({ cancel }) => {
    if (isDirty && !confirm('Je hebt niet-opgeslagen wijzigingen. Pagina verlaten?')) {
      cancel()
    }
  })

  function handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (!isDirty) return
    event.preventDefault()
    event.returnValue = ''
  }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<div class="space-y-4 pb-20 md:pb-0">
  <PageHeader
    title="Uitspraakregels"
    subtitle={countLabel}
  >
    {#snippet actions()}
      <MaybeTooltip
        when={!editable}
        tip={disabledTooltip}
        wrapperClass="max-md:hidden"
      >
        <button
          type="button"
          class={['btn btn-primary', !editable && 'btn-disabled']}
          onclick={handleAddRow}
          disabled={!editable}
        >
          <Plus
            aria-hidden="true"
            class="h-5 w-5"
          />
          Nieuwe regel
        </button>
      </MaybeTooltip>
    {/snippet}
  </PageHeader>

  {#if rows.length > 0}
    <div class="flex flex-wrap items-center justify-end gap-2">
      {#if search.trim()}
        <span class="text-sm text-base-content/60">
          {filteredRows.length} van {rows.length} getoond
        </span>
      {/if}
      <div class="relative">
        <Search
          aria-hidden="true"
          class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-base-content/40"
        />
        <input
          type="search"
          placeholder="Zoek in tekst of IPA…"
          class="input input-sm pl-9"
          aria-label="Zoek in uitspraakregels"
          bind:value={search}
        />
      </div>
    </div>
  {/if}

  {#if globalError}
    <div
      class="alert alert-error"
      role="alert"
    >
      <TriangleAlert
        aria-hidden="true"
        class="h-5 w-5"
      />
      <span>{globalError}</span>
    </div>
  {/if}

  <div class="card bg-base-100">
    <div class="card-body gap-4">
      <div
        class="alert alert-info alert-soft items-start"
        role="note"
      >
        <Info
          aria-hidden="true"
          class="mt-0.5 h-5 w-5 shrink-0"
        />
        <p class="text-sm leading-relaxed">
          Koppel een woord of tekst aan IPA-klanken, bijvoorbeeld
          <span class="font-mono">Albert Heijn</span> →
          <span class="font-mono">ˈɑlbərt ˈɦɛin</span>. Vul de IPA in zonder schuine strepen — de
          app zet de <span class="font-mono">/…/</span> er automatisch omheen.
        </p>
      </div>

      {#if rows.length === 0}
        <EmptyState
          icon={BookOpen}
          title="Nog geen uitspraakregels"
          description="Voeg een woord of tekstfragment toe en geef de IPA-uitspraak zonder /.../."
        />
      {:else if filteredRows.length === 0}
        <div class="py-10 text-center text-base-content/60">
          Geen regels gevonden voor "{search}".
        </div>
      {:else}
        <div class="hidden overflow-x-auto md:block">
          <table class="table">
            <thead>
              <tr>
                <th class="w-2/5">
                  <span>Woord of tekst</span>
                  <span class="block text-xs font-normal text-base-content/60">
                    Exacte tekst in de story
                  </span>
                </th>
                <th class="w-2/5">
                  <span>IPA-uitspraak</span>
                  <span class="block text-xs font-normal text-base-content/60">
                    Klankschrift, zonder /.../
                  </span>
                </th>
                <th class="w-28 text-center">
                  <span
                    class="tooltip tooltip-left"
                    data-tip="Aan: alleen exacte hoofdletters/kleine letters matchen. Uit: hoofdletterongevoelig matchen."
                  >
                    Hoofdletters
                  </span>
                </th>
                <th class="w-28 text-center">
                  <span
                    class="tooltip tooltip-left"
                    data-tip="Aan: alleen hele woorden matchen. Uit: ook midden in een woord matchen (bv. 'art' in 'kunst')."
                  >
                    Hele woorden
                  </span>
                </th>
                <th class="w-16 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredRows as row, index (row._key)}
                {@const errs = rowErrors[row._key]}
                <tr>
                  <td class="align-top">
                    <input
                      id="row-{row._key}-word"
                      type="text"
                      class={['input w-full', errs?.string_to_replace && 'input-error']}
                      bind:value={row.string_to_replace}
                      oninput={() => clearRowError(row._key, 'string_to_replace')}
                      aria-label="Woord of tekst regel {index + 1}"
                      placeholder="Albert Heijn"
                      disabled={!editable}
                    />
                    {#if errs?.string_to_replace}
                      <p
                        class="label max-w-full whitespace-normal text-sm leading-relaxed text-error"
                      >
                        {errs.string_to_replace}
                      </p>
                    {/if}
                  </td>
                  <td class="align-top">
                    <input
                      id="row-{row._key}-ipa"
                      type="text"
                      class={['input w-full', errs?.ipa && 'input-error']}
                      bind:value={row.ipa}
                      oninput={() => clearRowError(row._key, 'ipa')}
                      aria-label="IPA-uitspraak regel {index + 1}"
                      placeholder="ˈɑlbərt ˈɦɛin"
                      disabled={!editable}
                    />
                    {#if errs?.ipa}
                      <p
                        class="label max-w-full whitespace-normal text-sm leading-relaxed text-error"
                      >
                        {errs.ipa}
                      </p>
                    {/if}
                  </td>
                  <td class="text-center align-top">
                    <input
                      type="checkbox"
                      class="checkbox"
                      bind:checked={row.case_sensitive}
                      aria-label="Hoofdlettergevoelig regel {index + 1}"
                      disabled={!editable}
                    />
                  </td>
                  <td class="text-center align-top">
                    <input
                      type="checkbox"
                      class="checkbox"
                      bind:checked={row.word_boundaries}
                      aria-label="Woordgrenzen regel {index + 1}"
                      disabled={!editable}
                    />
                  </td>
                  <td class="text-right align-top">
                    <MaybeTooltip
                      when={!editable}
                      tip={disabledTooltip}
                      placement="tooltip-left"
                    >
                      <button
                        type="button"
                        class="btn btn-square btn-ghost btn-sm"
                        onclick={() => handleRemoveRow(row._key)}
                        disabled={!editable}
                        aria-label="Regel {index + 1} verwijderen"
                      >
                        <Trash2
                          aria-hidden="true"
                          class="h-4 w-4"
                        />
                      </button>
                    </MaybeTooltip>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="space-y-3 md:hidden">
          {#each filteredRows as row, index (row._key)}
            {@const errs = rowErrors[row._key]}
            <div class="rounded-lg border border-primary/20 bg-base-100 p-4 shadow-sm">
              <fieldset class="fieldset">
                <label
                  for="m-row-{row._key}-word"
                  class="fieldset-legend"
                >
                  Woord of tekst
                </label>
                <input
                  id="m-row-{row._key}-word"
                  type="text"
                  class={['input w-full', errs?.string_to_replace && 'input-error']}
                  bind:value={row.string_to_replace}
                  oninput={() => clearRowError(row._key, 'string_to_replace')}
                  aria-label="Woord of tekst regel {index + 1}"
                  placeholder="Albert Heijn"
                  disabled={!editable}
                />
                {#if errs?.string_to_replace}
                  <p class="label max-w-full whitespace-normal text-sm leading-relaxed text-error">
                    {errs.string_to_replace}
                  </p>
                {:else}
                  <p
                    class="label max-w-full whitespace-normal text-sm leading-relaxed text-base-content/70"
                  >
                    Exacte tekst die in de story voorkomt.
                  </p>
                {/if}
              </fieldset>

              <fieldset class="fieldset">
                <label
                  for="m-row-{row._key}-ipa"
                  class="fieldset-legend"
                >
                  IPA-uitspraak
                </label>
                <input
                  id="m-row-{row._key}-ipa"
                  type="text"
                  class={['input w-full', errs?.ipa && 'input-error']}
                  bind:value={row.ipa}
                  oninput={() => clearRowError(row._key, 'ipa')}
                  aria-label="IPA-uitspraak regel {index + 1}"
                  placeholder="ˈɑlbərt ˈɦɛin"
                  disabled={!editable}
                />
                {#if errs?.ipa}
                  <p class="label max-w-full whitespace-normal text-sm leading-relaxed text-error">
                    {errs.ipa}
                  </p>
                {:else}
                  <p
                    class="label max-w-full whitespace-normal text-sm leading-relaxed text-base-content/70"
                  >
                    {inlineIpaHint}
                  </p>
                {/if}
              </fieldset>

              <div class="mt-3 flex flex-wrap gap-4">
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    bind:checked={row.case_sensitive}
                    aria-label="Hoofdlettergevoelig regel {index + 1}"
                    disabled={!editable}
                  />
                  <span class="text-sm">Hoofdlettergevoelig</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    bind:checked={row.word_boundaries}
                    aria-label="Woordgrenzen regel {index + 1}"
                    disabled={!editable}
                  />
                  <span class="text-sm">Alleen hele woorden</span>
                </label>
              </div>

              <div class="mt-3 flex justify-end">
                <MaybeTooltip
                  when={!editable}
                  tip={disabledTooltip}
                  placement="tooltip-left"
                >
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    onclick={() => handleRemoveRow(row._key)}
                    disabled={!editable}
                    aria-label="Regel {index + 1} verwijderen"
                  >
                    <Trash2
                      aria-hidden="true"
                      class="h-4 w-4"
                    />
                    Verwijder
                  </button>
                </MaybeTooltip>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="btn btn-ghost"
          onclick={reloadOrDiscard}
          disabled={submitting}
        >
          <RefreshCw
            aria-hidden="true"
            class="h-5 w-5"
          />
          {reloadLabel}
        </button>
        <MaybeTooltip
          when={!editable}
          tip={disabledTooltip}
          placement="tooltip-left"
        >
          <button
            type="button"
            class="btn btn-primary"
            onclick={handleSave}
            disabled={saveDisabled}
          >
            {#if submitting}
              <span
                class="loading loading-sm loading-spinner"
                aria-hidden="true"
              ></span>
            {:else}
              <Check
                aria-hidden="true"
                class="h-5 w-5"
              />
            {/if}
            Opslaan
          </button>
        </MaybeTooltip>
      </div>
    </div>
  </div>
</div>

{#if editable}
  <button
    type="button"
    class="btn fixed right-6 bottom-6 z-40 btn-circle shadow-lg btn-lg btn-primary md:hidden"
    onclick={handleAddRow}
    aria-label="Nieuwe regel"
  >
    <Plus
      aria-hidden="true"
      class="h-6 w-6"
    />
  </button>
{/if}
