import type { GetStoriesData, PostStoriesData } from './generated/types.gen'
import { weekdaysToMask, type Weekdays } from '$lib/types'
import { toNumberOrNull } from '$lib/utils/form'

export type StoryFilters = NonNullable<GetStoriesData['query']>
export type StoryCreateInput = PostStoriesData['body']

// toStoryApiFormat keeps select-string and weekday-object UI state at the API boundary.
export const toStoryApiFormat = (data: {
  title: string
  text: string
  voice_id?: string | null
  status: 'draft' | 'active' | 'expired'
  start_date: string
  end_date: string
  weekdays: Weekdays
  is_breaking: boolean
}): StoryCreateInput => ({
  title: data.title,
  text: data.text,
  voice_id: toNumberOrNull(data.voice_id),
  status: data.status,
  start_date: data.start_date,
  end_date: data.end_date,
  weekdays: weekdaysToMask(data.weekdays),
  is_breaking: data.is_breaking,
})
