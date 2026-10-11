<script lang="ts">
  import { ApiError, notifyMutationError } from '$lib/api/client'
  import { patchStoriesId } from '$lib/api/generated/sdk.gen'
  import { ArchiveRestore, Info, TriangleAlert, X } from '$lib/components/icons'
  import { toast } from '$lib/stores/toast'
  import { showModal } from '$lib/utils/dialog'
  import { formatDate, formatDateTime, formatDuration } from '$lib/utils/format'
  import { formatWeekdays, statusColors, statusLabels } from '$lib/utils/labels'
  import { assessRestore } from '$lib/utils/story-restore'
  import type { Story } from '$lib/types'

  interface Props {
    story: Story
    onclose: () => void
    /** ondone runs after a restore; `edit` asks to continue on the edit page. */
    ondone: (edit: boolean) => void | Promise<void>
  }

  let { story, onclose, ondone }: Props = $props()

  type RestoreMode = 'as-is' | 'draft' | 'edit'

  // The last action is the primary one: the safer way to restore.
  const ACTIONS: Record<'draft' | 'edit' | 'none', { mode: RestoreMode; label: string }[]> = {
    draft: [
      { mode: 'as-is', label: 'Actief herstellen' },
      { mode: 'draft', label: 'Herstellen als concept' },
    ],
    edit: [
      { mode: 'as-is', label: 'Alleen herstellen' },
      { mode: 'edit', label: 'Herstellen en planning aanpassen' },
    ],
    none: [{ mode: 'as-is', label: 'Herstellen' }],
  }

  let pending = $state<RestoreMode | null>(null)
  const restoring = $derived(pending !== null)

  const assessment = $derived(assessRestore(story))
  const actions = $derived(ACTIONS[assessment.suggestion ?? 'none'])

  function close(): void {
    if (!restoring) onclose()
  }

  async function restore(mode: RestoreMode): Promise<void> {
    if (restoring) return
    pending = mode
    try {
      await patchStoriesId({ path: { id: story.id }, body: { deleted_at: '' } })
    } catch (err) {
      pending = null
      notifyMutationError(err, 'Herstellen mislukt')
      // The story is gone for good, so refresh the trash.
      if (err instanceof ApiError && err.status === 404) await ondone(false)
      return
    }
    // From here on every path ends in ondone, which removes the dialog.

    if (mode === 'draft') {
      // Babbel rejects status changes on a deleted story and cannot combine
      // them with a restore, so the status follows in a second request.
      try {
        await patchStoriesId({ path: { id: story.id }, body: { status: 'draft' } })
      } catch (err) {
        console.error('[stories] set restored story to draft failed', err)
        // The story is live again, so this message must not slip by.
        toast.error('Bericht hersteld, maar nog actief: zet het zelf op concept', 10_000)
        await ondone(true)
        return
      }
    }

    toast.success(mode === 'draft' ? 'Bericht hersteld als concept' : 'Bericht hersteld')
    await ondone(mode === 'edit')
  }
</script>

<dialog
  class="modal modal-bottom sm:modal-middle"
  aria-labelledby="restore-story-title"
  onkeydown={e => {
    // Chrome lets a page cancel only one Escape per user activation, so stop the
    // request at the key while a restore runs.
    if (e.key === 'Escape' && restoring) e.preventDefault()
  }}
  oncancel={e => {
    e.preventDefault()
    close()
  }}
  onclose={e => {
    // A close the page could not cancel (Android back) still unmounts the dialog.
    // The teardown's own close() fires after removal and is ignored.
    if (e.currentTarget.isConnected) onclose()
  }}
  {@attach showModal}
>
  <div class="modal-box sm:max-w-2xl">
    <div class="mb-4 flex items-start justify-between gap-2">
      <h2
        id="restore-story-title"
        class="text-lg font-bold"
      >
        Bericht herstellen
      </h2>
      <button
        type="button"
        class="btn btn-square btn-ghost btn-sm"
        onclick={close}
        disabled={restoring}
        aria-label="Sluiten"
      >
        <X
          aria-hidden="true"
          class="h-4 w-4"
        />
      </button>
    </div>

    <p class="font-medium wrap-break-word">{story.title}</p>
    {#if story.deleted_at}
      <p class="text-sm text-base-content/70">
        Verwijderd op {formatDateTime(story.deleted_at)}
      </p>
    {/if}

    <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt class="text-base-content/70">Status</dt>
      <dd>
        <span class="badge badge-sm {statusColors[story.status]}">
          {statusLabels[story.status]}
        </span>
      </dd>
      <dt class="text-base-content/70">Periode</dt>
      <dd>{formatDate(story.start_date)} t/m {formatDate(story.end_date)}</dd>
      <dt class="text-base-content/70">Dagen</dt>
      <dd>{formatWeekdays(story.weekdays)}</dd>
      <dt class="text-base-content/70">Audio</dt>
      <dd>
        {story.audio_file ? `Ja (${formatDuration(story.duration_seconds)})` : 'Nee'}
      </dd>
    </dl>

    <p class="mt-4 text-sm text-base-content/70">
      Herstellen zet het bericht terug met deze status en planning.
    </p>

    {#if assessment.notice}
      {@const { tone, message } = assessment.notice}
      {@const Icon = tone === 'warning' ? TriangleAlert : Info}
      <div class={['mt-3 alert items-start text-sm', tone === 'warning' && 'alert-warning']}>
        <Icon
          aria-hidden="true"
          class="h-5 w-5 shrink-0"
        />
        {#if tone === 'warning'}
          <span class="sr-only">Let op:</span>
        {/if}
        <span>{message}</span>
      </div>
    {/if}

    <!-- Phones stack the actions, primary on top; wider screens put them in a row, primary last. -->
    <div class="modal-action flex-col-reverse sm:flex-row">
      <button
        type="button"
        class="btn btn-ghost"
        onclick={close}
        disabled={restoring}
      >
        Annuleren
      </button>
      {#each actions as action, i (action.mode)}
        {@const primary = i === actions.length - 1}
        <button
          type="button"
          class={['btn', primary ? 'btn-primary' : 'btn-outline']}
          onclick={() => restore(action.mode)}
          disabled={restoring}
        >
          {#if pending === action.mode}
            <span class="loading loading-sm loading-spinner"></span>
          {:else if primary}
            <ArchiveRestore
              aria-hidden="true"
              class="h-5 w-5"
            />
          {/if}
          {action.label}
        </button>
      {/each}
    </div>
  </div>
  <div class="modal-backdrop">
    <button
      type="button"
      onclick={close}
      tabindex="-1"
      aria-hidden="true"
    >
      Sluiten
    </button>
  </div>
</dialog>
