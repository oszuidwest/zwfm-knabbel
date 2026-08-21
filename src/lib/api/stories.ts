import type { GetStoriesData, PostStoriesData } from './generated/types.gen'
import type { StoryFormData } from '$lib/schemas/story'
import { weekdaysToMask } from '$lib/types'
import { toNumberOrNull } from '$lib/utils/form'

export type StoryFilters = NonNullable<GetStoriesData['query']>
export type StoryCreateInput = PostStoriesData['body']

// toStoryApiFormat keeps select-string and weekday-object UI state at the API boundary.
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
