<script lang="ts">
  import { ApiError, notifyMutationError } from '$lib/api/client'
  import { patchStoriesId } from '$lib/api/generated/sdk.gen'
  import { ArchiveRestore, Info, TriangleAlert } from '$lib/components/icons'
  import { Modal } from '$lib/components/ui'
  import { toast } from '$lib/stores/toast'
  import { formatDate, formatDateTime, formatDuration } from '$lib/utils/format'
  import { formatWeekdays, statusColors, statusLabels } from '$lib/utils/labels'
  import { assessRestore } from '$lib/utils/story-restore'
  import type { Story } from '$lib/types'

  interface Props {
    story: Story
    onclose: () => void
    /** ondone runs after a restore, also when the dialog closed in the meantime. */
    ondone: (story: Story, edit: boolean) => void | Promise<void>
  }

  let { story, onclose, ondone }: Props = $props()

  type RestoreMode = 'as-is' | 'draft' | 'edit'

  const LABELS = {
    draft: { asIs: 'Actief herstellen', suggested: 'Herstellen als concept' },
    edit: { asIs: 'Alleen herstellen', suggested: 'Herstellen en planning aanpassen' },
  }

  let pending = $state<RestoreMode | null>(null)
  const restoring = $derived(pending !== null)

  const assessment = $derived(assessRestore(story))
  const suggestion = $derived(assessment.suggestion)

  async function restore(mode: RestoreMode): Promise<void> {
    if (restoring) return
    pending = mode
    // The dialog can close while this runs, so read the prop before the first await.
    const target = story
    try {
      await patchStoriesId({ path: { id: target.id }, body: { deleted_at: '' } })
    } catch (err) {
      pending = null
      notifyMutationError(err, 'Herstellen mislukt')
      if (err instanceof ApiError && err.status === 404) await ondone(target, false)
      return
    }
    if (mode === 'draft') {
      // Babbel requires separate restore and status updates; the story is active in between.
      try {
        await patchStoriesId({ path: { id: target.id }, body: { status: 'draft' } })
      } catch (err) {
        console.error('[stories] set restored story to draft failed', err)
        toast.error('Bericht hersteld, maar nog actief: zet het zelf op concept', 10_000)
        await ondone(target, true)
        return
      }
    }

    toast.success(mode === 'draft' ? 'Bericht hersteld als concept' : 'Bericht hersteld')
    await ondone(target, mode === 'edit')
  }
</script>

<Modal
  title="Bericht herstellen"
  {onclose}
  boxClass="sm:max-w-2xl"
>
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
    <div
      class={['mt-3 alert items-start alert-soft text-sm', tone === 'warning' && 'alert-warning']}
    >
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

  {#snippet actions()}
    <button
      type="button"
      class="btn btn-ghost"
      onclick={onclose}
    >
      Annuleren
    </button>
    {#if suggestion}
      {@render restoreButton('as-is', LABELS[suggestion].asIs, false)}
      {@render restoreButton(suggestion, LABELS[suggestion].suggested, true)}
    {:else}
      {@render restoreButton('as-is', 'Herstellen', true)}
    {/if}
  {/snippet}
</Modal>

{#snippet restoreButton(mode: RestoreMode, label: string, primary: boolean)}
  <button
    type="button"
    class={['btn', primary ? 'btn-primary' : 'btn-outline']}
    onclick={() => restore(mode)}
    disabled={restoring}
  >
    {#if pending === mode}
      <span class="loading loading-sm loading-spinner"></span>
    {:else if primary}
      <ArchiveRestore
        aria-hidden="true"
        class="h-5 w-5"
      />
    {/if}
    {label}
  </button>
{/snippet}
