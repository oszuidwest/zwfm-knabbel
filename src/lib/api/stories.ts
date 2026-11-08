import { patchStoriesId } from './generated/sdk.gen'
import type { GetStoriesData, PostStoriesData } from './generated/types.gen'
import type { StoryFormData } from '#lib/schemas/story.js'
import { weekdaysToMask } from '#lib/types/index.js'
import { toNumberOrNull } from '#lib/utils/form.js'

export type StoryFilters = NonNullable<GetStoriesData['query']>
export type StoryCreateInput = PostStoriesData['body']

export const toStoryApiFormat = (data: StoryFormData): StoryCreateInput => ({
  title: data.title,
  text: data.text,
  voice_id: toNumberOrNull(data.voice_id),
  status: data.status,
  start_date: data.start_date,
  end_date: data.end_date,
  weekdays: weekdaysToMask(data.weekdays),
  is_breaking: data.is_breaking,
})

/** Babbel restores and sets a draft status in one transaction, so a draft never airs. */
export const restoreStory = (id: number, asDraft: boolean) =>
  patchStoriesId({
    path: { id },
    body: asDraft ? { deleted_at: '', status: 'draft' } : { deleted_at: '' },
  })
