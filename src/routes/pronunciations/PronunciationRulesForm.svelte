<script lang="ts">
  import { tick } from 'svelte'
  import { beforeNavigate, invalidateAll } from '$app/navigation'
  import { ApiError } from '$lib/api/client'
  import { settingsApi } from '$lib/api/settings'
  import {
    pronunciationRulesSchema,
    type PronunciationRuleFormData,
  } from '$lib/schemas/pronunciations'
  import { toast } from '$lib/stores/toast'
  import { formatDateTime } from '$lib/utils/format'
  import { EmptyState } from '$lib/components/ui'
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
  import type {
    PronunciationRule,
    PronunciationRulesList,
    PronunciationRulesUpdate,
  } from '$lib/types'
  import type { TTSUnavailable } from './+page'

  interface Props {
    initial: PronunciationRulesList
    ttsUnavailable: TTSUnavailable | null
    canEdit: boolean
  }

  let { initial, ttsUnavailable: initialTtsUnavailable, canEdit }: Props = $props()

  interface DraftRow {
    _key: number
    string_to_replace: string
    alias: string
    case_sensitive: boolean
    word_boundaries: boolean
  }

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

  // svelte-ignore state_referenced_locally
  const snapshot = initial.rules.map(makeDraft)

  let rows = $state<DraftRow[]>(structuredClone($state.snapshot(snapshot)))
  // svelte-ignore state_referenced_locally
  let warning = $state<string | undefined>(initial.warning)
  // svelte-ignore state_referenced_locally
  let createdAt = $state<string | null>(initial.created_at)
  // svelte-ignore state_referenced_locally
  let ttsUnavailable = $state<TTSUnavailable | null>(initialTtsUnavailable)
  let rowErrors = $state<Record<number, Partial<Record<keyof PronunciationRuleFormData, string>>>>(
    {}
  )
  let globalError = $state<string | null>(null)
  let submitting = $state(false)
  let search = $state('')

  const editable = $derived(canEdit && !ttsUnavailable)

  const isDirty = $derived(JSON.stringify(toPayload(rows)) !== JSON.stringify(toPayload(snapshot)))
  const saveDisabled = $derived(!editable || !isDirty || submitting)

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

  async function handleAddRow(): Promise<void> {
    if (!editable) return
    const key = nextKey++
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
    document.getElementById(`row-${key}-word`)?.focus()
  }

  function handleRemoveRow(key: number): void {
    if (!editable) return
    rows = rows.filter(r => r._key !== key)
    if (rowErrors[key]) {
      const { [key]: _removed, ...rest } = rowErrors
      rowErrors = rest
    }
  }

  function clearRowError(key: number, field: keyof PronunciationRuleFormData): void {
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
      const nextErrors: typeof rowErrors = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'rules' && typeof issue.path[1] === 'number') {
          const row = rows[issue.path[1]]
          const field = issue.path[2] as keyof PronunciationRuleFormData
          if (row) {
            nextErrors[row._key] = { ...nextErrors[row._key], [field]: issue.message }
          }
        } else {
          globalError = issue.message
        }
      }
      rowErrors = nextErrors
      search = ''
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
      await settingsApi.updateTtsPronunciations({ rules: payload })
      toast.success('Uitspraakregels opgeslagen')
      await invalidateAll()
    } catch (err) {
      handleSaveError(err)
    } finally {
      submitting = false
    }
  }

  function handleSaveError(err: unknown): void {
    if (!(err instanceof ApiError)) {
      toast.error('Opslaan mislukt')
      return
    }

    const details = err.details as
      | {
          code?: string
          type?: string
          detail?: string
          hint?: string
          errors?: Array<{ field: string; message: string }>
        }
      | undefined

    if (err.status === 422 && details?.errors?.length) {
      const re = /^rules\[(\d+)\]\.(\w+)$/
      const nextErrors: typeof rowErrors = {}
      const globalMessages: string[] = []
      for (const e of details.errors) {
        const m = re.exec(e.field)
        if (!m) {
          globalMessages.push(e.message)
          continue
        }
        const idx = Number(m[1])
        const field = m[2] as keyof PronunciationRuleFormData
        const row = rows[idx]
        if (row) {
          nextErrors[row._key] = { ...nextErrors[row._key], [field]: e.message }
        } else {
          globalMessages.push(e.message)
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

    if (err.status === 409) {
      globalError =
        'De koppeling met het uitspraakwoordenboek is intussen gewijzigd. Herlaad de pagina om de nieuwste versie te zien.'
      toast.error('Conflict — herlaad de pagina')
      return
    }
    if (err.status === 403) {
      toast.error('Geen rechten om uitspraakregels te wijzigen')
      return
    }
    if (err.status === 501) {
      ttsUnavailable = {
        detail: details?.detail ?? 'Text-to-speech is niet geconfigureerd op de server.',
        hint: details?.hint,
      }
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
    toast.error(details?.detail ?? err.message ?? 'Opslaan mislukt')
  }

  function handleCancel(): void {
    if (!isDirty) return
    if (!confirm('Weet je zeker dat je je wijzigingen wilt annuleren?')) return
    rows = structuredClone($state.snapshot(snapshot))
    rowErrors = {}
    globalError = null
    search = ''
  }

  async function handleReload(): Promise<void> {
    if (isDirty && !confirm('Je hebt niet-opgeslagen wijzigingen. Herladen?')) return
    await invalidateAll()
  }

  beforeNavigate(({ cancel }) => {
    if (isDirty && !confirm('Je hebt niet-opgeslagen wijzigingen. Pagina verlaten?')) {
      cancel()
    }
  })

  $effect(() => {
    const handler = (event: BeforeUnloadEvent): void => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  })
</script>

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
      <!-- Toolbar -->
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
          {#if editable}
            <button
              type="button"
              class="btn btn-primary btn-sm"
              onclick={handleAddRow}
            >
              <Plus
                aria-hidden="true"
                class="h-4 w-4"
              />
              Nieuwe regel
            </button>
          {/if}
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
        <!-- Desktop: table -->
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
              {#each filteredRows as row (row._key)}
                {@const errs = rowErrors[row._key]}
                <tr>
                  <td class="align-top">
                    <input
                      id="row-{row._key}-word"
                      type="text"
                      class={['input w-full', errs?.string_to_replace && 'input-error']}
                      bind:value={row.string_to_replace}
                      oninput={() => clearRowError(row._key, 'string_to_replace')}
                      aria-label="Woord"
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
                      aria-label="Uitspraak"
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
                      aria-label="Hoofdlettergevoelig"
                      disabled={!editable}
                    />
                  </td>
                  <td class="text-center align-top">
                    <input
                      type="checkbox"
                      class="checkbox"
                      bind:checked={row.word_boundaries}
                      aria-label="Woordgrenzen"
                      disabled={!editable}
                    />
                  </td>
                  <td class="text-right align-top">
                    {#if editable}
                      <button
                        type="button"
                        class="btn btn-square btn-ghost btn-sm"
                        onclick={() => handleRemoveRow(row._key)}
                        aria-label="Regel verwijderen"
                      >
                        <Trash2
                          aria-hidden="true"
                          class="h-4 w-4"
                        />
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Mobile: stacked cards -->
        <div class="space-y-3 md:hidden">
          {#each filteredRows as row (row._key)}
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
                    disabled={!editable}
                  />
                  <span class="text-sm">Hoofdlettergevoelig</span>
                </label>
                <label class="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    bind:checked={row.word_boundaries}
                    disabled={!editable}
                  />
                  <span class="text-sm">Woordgrenzen</span>
                </label>
              </div>

              {#if editable}
                <div class="mt-3 flex justify-end">
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    onclick={() => handleRemoveRow(row._key)}
                  >
                    <Trash2
                      aria-hidden="true"
                      class="h-4 w-4"
                    />
                    Verwijder
                  </button>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}

      {#if editable}
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="btn btn-ghost"
            onclick={handleCancel}
            disabled={!isDirty || submitting}
          >
            <X
              aria-hidden="true"
              class="h-5 w-5"
            />
            Annuleren
          </button>
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
        </div>
      {/if}
    </div>
  </div>
</div>
