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
  import { formatDateTime } from '$lib/utils/format'
  import { EmptyState, MaybeTooltip } from '$lib/components/ui'
  import {
    BookOpen,
    Check,
    Info,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    TriangleAlert,
    X,
  } from '$lib/components/icons'
  import {
    createTTSUnavailable,
    type TTSUnavailable,
    type PronunciationRule,
    type PronunciationRulesList,
    type PronunciationRulesUpdate,
  } from '$lib/types'

  interface Props {
    initial: PronunciationRulesList
    ttsUnavailable: TTSUnavailable | null
    canEdit: boolean
  }

  let { initial, ttsUnavailable: initialTtsUnavailable, canEdit }: Props = $props()

  interface DraftRow {
    readonly _key: number
    string_to_replace: string
    alias: string
    case_sensitive: boolean
    word_boundaries: boolean
  }

  type RowErrors = Record<number, Partial<Record<PronunciationRuleField, string>>>

  const SERVER_RULE_ERROR_RE = /^rules\[(\d+)\]\.(\w+)$/

  let nextKey = 1
  const makeDraft = (r: PronunciationRule): DraftRow => ({
    _key: nextKey++,
    string_to_replace: r.string_to_replace ?? '',
    alias: r.alias ?? '',
    case_sensitive: r.case_sensitive ?? true,
    word_boundaries: r.word_boundaries ?? true,
  })

  const toPayload = (drafts: DraftRow[]): PronunciationRulesUpdate['rules'] =>
    drafts.map(r => ({
      string_to_replace: r.string_to_replace.trim(),
      alias: r.alias.trim(),
      case_sensitive: r.case_sensitive,
      word_boundaries: r.word_boundaries,
    }))

  function initialDraftState(): {
    snapshot: DraftRow[]
    rows: DraftRow[]
    warning: string | undefined
    createdAt: string | null
    ttsUnavailable: TTSUnavailable | null
  } {
    const initialSnapshot = initial.rules.map(makeDraft)

    return {
      snapshot: initialSnapshot,
      rows: structuredClone(initialSnapshot),
      warning: initial.warning,
      createdAt: initial.created_at,
      ttsUnavailable: initialTtsUnavailable,
    }
  }

  function draftsEqual(a: DraftRow[], b: DraftRow[]): boolean {
    if (a.length !== b.length) return false

    return a.every((row, index) => {
      const other = b[index]
      return (
        row.string_to_replace.trim() === other.string_to_replace.trim() &&
        row.alias.trim() === other.alias.trim() &&
        row.case_sensitive === other.case_sensitive &&
        row.word_boundaries === other.word_boundaries
      )
    })
  }

  const draftState = initialDraftState()
  let snapshot = $state.raw<DraftRow[]>(draftState.snapshot)
  let rows = $state<DraftRow[]>(draftState.rows)
  let warning = $state<string | undefined>(draftState.warning)
  let createdAt = $state<string | null>(draftState.createdAt)
  let ttsUnavailable = $state<TTSUnavailable | null>(draftState.ttsUnavailable)
  let rowErrors = $state<RowErrors>({})
  let globalError = $state<string | null>(null)
  let submitting = $state(false)
  let search = $state('')

  const editable = $derived(canEdit && !ttsUnavailable)
  const disabledTooltip = $derived(canEdit ? 'TTS niet geconfigureerd' : 'Geen rechten')

  const isDirty = $derived(!draftsEqual(rows, snapshot))
  const saveDisabled = $derived(!editable || !isDirty || submitting)
  const cancelDisabled = $derived(!editable || !isDirty || submitting)

  const filteredRows = $derived.by(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      r => r.string_to_replace.toLowerCase().includes(q) || r.alias.toLowerCase().includes(q)
    )
  })

  const countLabel = $derived(`${rows.length} ${rows.length === 1 ? 'regel' : 'regels'}`)
  const savedAtLabel = $derived(
    createdAt ? `Laatst opgeslagen: ${formatDateTime(createdAt)}` : null
  )

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
    warning = list.warning
    createdAt = list.created_at
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
        alias: '',
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

    if (err.status === 422 && details?.errors?.length) {
      const nextErrors: RowErrors = {}
      const globalMessages = new Set<string>()
      for (const e of details.errors) {
        const message = e.message ?? details.detail ?? 'De server heeft een veldfout teruggegeven'
        if (!e.field) {
          globalMessages.add(message)
          continue
        }

        const m = SERVER_RULE_ERROR_RE.exec(e.field)
        if (!m) {
          globalMessages.add(message)
          continue
        }
        const idx = Number(m[1])
        const field = m[2]
        const row = rows[idx]
        if (row && isPronunciationRuleField(field)) {
          nextErrors[row._key] = { ...nextErrors[row._key], [field]: message }
        } else {
          globalMessages.add(message)
        }
      }
      rowErrors = nextErrors
      if (globalMessages.size > 0) {
        globalError = [...globalMessages].join(' ')
      }
      search = ''
      toast.error(
        globalMessages.size > 0
          ? 'De server heeft fouten gevonden'
          : 'De server heeft fouten gevonden — zie de rijen.'
      )
      return
    }

    if (err.status === 409) {
      globalError =
        'De koppeling met het uitspraakwoordenboek is intussen gewijzigd. Herlaad de pagina om de nieuwste versie te zien.'
      toast.error('Conflict — herlaad de pagina')
      return
    }
    if (err.status === 501) {
      ttsUnavailable = createTTSUnavailable(details)
      globalError = ttsUnavailable.detail
      toast.error('TTS niet geconfigureerd')
      return
    }
    if (err.status === 502 || err.status === 503) {
      globalError = details?.hint ?? details?.detail ?? 'ElevenLabs niet bereikbaar'
      toast.error(globalError)
      return
    }
    if (err.status === 429) {
      toast.error('Te veel verzoeken — probeer het later opnieuw')
      return
    }
    notifyMutationError(err, details?.detail ?? err.message ?? 'Opslaan mislukt')
  }

  function handleCancel(): void {
    if (!isDirty) return
    if (!confirm('Weet je zeker dat je je wijzigingen wilt annuleren?')) return
    resetToSnapshot()
  }

  async function handleReload(): Promise<void> {
    if (isDirty && !confirm('Je hebt niet-opgeslagen wijzigingen. Herladen?')) return
    try {
      await invalidateAll()
      await tick()
      applyRulesList(initial)
      ttsUnavailable = initialTtsUnavailable
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

<div class="space-y-4">
  {#if ttsUnavailable}
    <div
      class="alert alert-info"
      role="status"
    >
      <Info
        aria-hidden="true"
        class="h-5 w-5"
      />
      <div>
        <div class="font-medium">Text-to-speech is niet geconfigureerd</div>
        <div class="text-sm">
          {ttsUnavailable.detail}
          {#if ttsUnavailable.hint}
            <div class="opacity-80">{ttsUnavailable.hint}</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if warning}
    <div
      class="alert alert-warning"
      role="alert"
    >
      <TriangleAlert
        aria-hidden="true"
        class="h-5 w-5"
      />
      <span>{warning}</span>
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
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label class="input max-w-md">
          <Search
            aria-hidden="true"
            class="h-4 w-4 opacity-60"
          />
          <input
            type="text"
            placeholder="Zoek in woord of uitspraak…"
            aria-label="Zoek in uitspraakregels"
            bind:value={search}
          />
        </label>
        <div class="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
          <span>
            {#if search.trim()}
              {filteredRows.length} van {rows.length} getoond
            {:else}
              {countLabel}
            {/if}
          </span>
          {#if savedAtLabel}
            <span class="hidden sm:inline">·</span>
            <span>{savedAtLabel}</span>
          {/if}
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            onclick={handleReload}
            aria-label="Herlaad uitspraakregels"
          >
            <RefreshCw
              aria-hidden="true"
              class="h-4 w-4"
            />
            Herlaad
          </button>
          <MaybeTooltip
            when={!editable}
            tip={disabledTooltip}
            placement="tooltip-left"
          >
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onclick={handleAddRow}
              disabled={!editable}
            >
              <Plus
                aria-hidden="true"
                class="h-4 w-4"
              />
              Nieuwe regel
            </button>
          </MaybeTooltip>
        </div>
      </div>

      {#if rows.length === 0}
        <EmptyState
          icon={BookOpen}
          title="Nog geen uitspraakregels"
          description="Voeg een regel toe om woorden anders uit te laten spreken."
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
                <th class="w-2/5">Woord</th>
                <th class="w-2/5">Uitspraak</th>
                <th class="w-24 text-center">
                  <span
                    class="tooltip tooltip-left"
                    data-tip="Aan: alleen exacte hoofdletters/kleine letters matchen. Uit: hoofdletterongevoelig matchen."
                  >
                    Hfd
                  </span>
                </th>
                <th class="w-24 text-center">
                  <span
                    class="tooltip tooltip-left"
                    data-tip="Aan: alleen hele woorden matchen. Uit: ook midden in een woord matchen (bv. 'art' in 'kunst')."
                  >
                    Grens
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
                      aria-label="Woord regel {index + 1}"
                      disabled={!editable}
                    />
                    {#if errs?.string_to_replace}
                      <p class="label text-error">{errs.string_to_replace}</p>
                    {/if}
                  </td>
                  <td class="align-top">
                    <input
                      id="row-{row._key}-alias"
                      type="text"
                      class={['input w-full', errs?.alias && 'input-error']}
                      bind:value={row.alias}
                      oninput={() => clearRowError(row._key, 'alias')}
                      aria-label="Uitspraak regel {index + 1}"
                      disabled={!editable}
                    />
                    {#if errs?.alias}
                      <p class="label text-error">{errs.alias}</p>
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
            <div class="rounded-lg border border-base-300 p-4">
              <fieldset class="fieldset">
                <label
                  for="m-row-{row._key}-word"
                  class="fieldset-legend"
                >
                  Woord
                </label>
                <input
                  id="m-row-{row._key}-word"
                  type="text"
                  class={['input w-full', errs?.string_to_replace && 'input-error']}
                  bind:value={row.string_to_replace}
                  oninput={() => clearRowError(row._key, 'string_to_replace')}
                  aria-label="Woord regel {index + 1}"
                  disabled={!editable}
                />
                {#if errs?.string_to_replace}
                  <p class="label text-error">{errs.string_to_replace}</p>
                {/if}
              </fieldset>

              <fieldset class="fieldset">
                <label
                  for="m-row-{row._key}-alias"
                  class="fieldset-legend"
                >
                  Uitspraak
                </label>
                <input
                  id="m-row-{row._key}-alias"
                  type="text"
                  class={['input w-full', errs?.alias && 'input-error']}
                  bind:value={row.alias}
                  oninput={() => clearRowError(row._key, 'alias')}
                  aria-label="Uitspraak regel {index + 1}"
                  disabled={!editable}
                />
                {#if errs?.alias}
                  <p class="label text-error">{errs.alias}</p>
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
                  <span class="text-sm">Woordgrenzen</span>
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
        <MaybeTooltip
          when={!editable}
          tip={disabledTooltip}
          placement="tooltip-left"
        >
          <button
            type="button"
            class="btn btn-ghost"
            onclick={handleCancel}
            disabled={cancelDisabled}
          >
            <X
              aria-hidden="true"
              class="h-5 w-5"
            />
            Annuleren
          </button>
        </MaybeTooltip>
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
