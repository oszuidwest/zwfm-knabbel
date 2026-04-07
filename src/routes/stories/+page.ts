import type { PageLoad } from './$types'
import { storiesApi, type StoryFilters } from '$lib/api/stories'
import { toLocalDateString } from '$lib/utils/format'
import { getPaginationParams, getPaginationInfo } from '$lib/utils/pagination'
import { WEEKDAY_BITS_BY_DAY } from '$lib/types'

function getDateAndWeekdayBit(dateFilter: string): { date: string; weekdayBit: number } | null {
  if (!dateFilter) return null

  const targetDate = new Date()
  if (dateFilter === 'tomorrow') {
    targetDate.setDate(targetDate.getDate() + 1)
  }

  const dateStr = toLocalDateString(targetDate)
  const weekdayBit = WEEKDAY_BITS_BY_DAY[targetDate.getDay()] ?? 0

  return { date: dateStr, weekdayBit }
}

export const load: PageLoad = async ({ fetch, url }) => {
  const statusFilter = url.searchParams.get('status') ?? ''
  const dateFilter = url.searchParams.get('date') ?? ''
  const audioFilter = url.searchParams.get('audio') ?? ''
  const searchQuery = url.searchParams.get('q') ?? ''

  // Pagination params
  const { page, limit, offset } = getPaginationParams(url.searchParams)

  // Build API filter params
  const params: StoryFilters = {
    limit,
    offset,
  }

  if (statusFilter) {
    params['filter[status]'] = statusFilter
  }

  if (searchQuery) {
    params.search = searchQuery
  }

  // Date filter: today/tomorrow
  const dateInfo = getDateAndWeekdayBit(dateFilter)
  if (dateInfo) {
    params['filter[start_date][lte]'] = dateInfo.date
    params['filter[end_date][gte]'] = dateInfo.date
    params['filter[weekdays][band]'] = dateInfo.weekdayBit
  }

  // Audio filter (filter on audio_url presence)
  if (audioFilter === 'with') {
    params['filter[audio_url][ne]'] = ''
  } else if (audioFilter === 'without') {
    params['filter[audio_url]'] = ''
  }

  const response = await storiesApi.getAll(params, fetch)

  return {
    stories: response.data,
    pagination: getPaginationInfo(response.total, page, limit),
  }
}
