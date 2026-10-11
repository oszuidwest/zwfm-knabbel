<script lang="ts">
  import { ApiError, notifyMutationError } from '$lib/api/client'
  import { patchStoriesId } from '$lib/api/generated/sdk.gen'
  import { ArchiveRestore, Info, TriangleAlert, X } from '$lib/components/icons'
  import { toast } from '$lib/stores/toast'
  import { formatDate, formatDateTime, formatDuration } from '$lib/utils/format'
  import { statusColors, statusLabels } from '$lib/utils/labels'
  import { assessRestore, formatWeekdays } from '$lib/utils/story-restore'
  import type { Story } from '$lib/types'

  interface Props {
    story: Story
    onclose: () => void
    /** ondone runs after a restore; `edit` asks to continue on the edit page. */
    ondone: (edit: boolean) => void | Promise<void>
  }

  let { story, onclose, ondone }: Props = $props()

  type RestoreMode = 'as-is' | 'draft' | 'edit'

  let pending = $state<RestoreMode | null>(null)
  const restoring = $derived(pending !== null)

  const assessment = $derived(assessRestore(story))
  // The safer option comes last and is the primary action.
  const actions = $derived.by((): { mode: RestoreMode; label: string; primary: boolean }[] => {
    switch (assessment.suggestion) {
      case 'draft':
        return [
          { mode: 'as-is', label: 'Actief herstellen', primary: false },
          { mode: 'draft', label: 'Herstellen als concept', primary: true },
        ]
      case 'reschedule':
        return [
          { mode: 'as-is', label: 'Alleen herstellen', primary: false },
          { mode: 'edit', label: 'Herstellen en planning aanpassen', primary: true },
        ]
      default:
        return [{ mode: 'as-is', label: 'Herstellen', primary: true }]
    }
  })

  // Like ReadMode, the dialog is removed rather than closed, so focus returns to the opener here.
  function showModal(dialog: HTMLDialogElement): () => void {
    const opener = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }

  function close(): void {
    if (!restoring) onclose()
  }

  async function restore(mode: RestoreMode): Promise<void> {
    if (restoring) return
    pending = mode
    try {
      try {
        await patchStoriesId({ path: { id: story.id }, body: { deleted_at: '' } })
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          toast.error('Dit bericht bestaat niet meer')
          await ondone(false)
        } else {
          notifyMutationError(err, 'Herstellen mislukt')
        }
        return
      }

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
    } finally {
      pending = null
    }
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

    {#if assessment.notices.length > 0}
      <ul class="mt-3 space-y-2">
        {#each assessment.notices as notice (notice.message)}
          <li class={['alert items-start text-sm', notice.tone === 'warning' && 'alert-warning']}>
            {#if notice.tone === 'warning'}
              <TriangleAlert
                aria-hidden="true"
                class="h-5 w-5 shrink-0"
              />
              <span><span class="sr-only">Let op: </span>{notice.message}</span>
            {:else}
              <Info
                aria-hidden="true"
                class="h-5 w-5 shrink-0"
              />
              <span>{notice.message}</span>
            {/if}
          </li>
        {/each}
      </ul>
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
      {#each actions as action (action.mode)}
        <button
          type="button"
          class={['btn', action.primary ? 'btn-primary' : 'btn-outline']}
          onclick={() => restore(action.mode)}
          disabled={restoring}
        >
          {#if pending === action.mode}
            <span class="loading loading-sm loading-spinner"></span>
          {:else if action.primary}
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
  <form
    method="dialog"
    class="modal-backdrop"
  >
    <button
      type="button"
      onclick={close}
      tabindex="-1"
      aria-hidden="true"
    >
      Sluiten
    </button>
  </form>
</dialog>
