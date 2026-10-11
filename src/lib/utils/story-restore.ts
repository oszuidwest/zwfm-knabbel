import { maskToWeekdays, WEEKDAY_BITS_BY_DAY, type Story, type Weekdays } from '$lib/types'
import { formatDate, parseDate, toLocalDateString } from './format'
import { weekdayLabels } from './labels'

type RestoreStory = Pick<
  Story,
  'status' | 'start_date' | 'end_date' | 'weekdays' | 'audio_file' | 'metadata'
>

export interface RestoreNotice {
  tone: 'warning' | 'info'
  message: string
}

export interface RestoreAssessment {
  /**
   * The safer way to restore, offered as the primary action: `reschedule`
   * when the planning is over, `draft` when the story would reach bulletins.
   */
  suggestion: 'reschedule' | 'draft' | null
  notices: RestoreNotice[]
}

const WEEKDAY_ORDER: (keyof Weekdays)[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

/** formatWeekdays renders a weekday bitmask as Dutch day abbreviations. */
export function formatWeekdays(mask: number): string {
  if ((mask & 127) === 127) return 'Elke dag'
  const weekdays = maskToWeekdays(mask)
  const days = WEEKDAY_ORDER.filter(day => weekdays[day]).map(day => weekdayLabels[day])
  return days.length > 0 ? days.join(', ') : 'Geen dagen'
}

/** wordpressPostId returns the WordPress post a story was created from, if any. */
export function wordpressPostId(story: Pick<Story, 'metadata'>): string | undefined {
  const id = story.metadata?.wordpress_id
  return typeof id === 'number' || (typeof id === 'string' && id !== '') ? String(id) : undefined
}

function addDays(date: string, days: number): string {
  const result = parseDate(date)
  result.setDate(result.getDate() + days)
  return toLocalDateString(result)
}

/**
 * firstBroadcastDay returns the first day from `today` on which Babbel's
 * bulletin selection matches the story's period and weekdays, or null.
 */
export function firstBroadcastDay(story: RestoreStory, today: string): string | null {
  if (!story.start_date || !story.end_date) return null
  const from = story.start_date > today ? story.start_date : today
  // Seven consecutive days cover every weekday once.
  for (let offset = 0; offset < 7; offset++) {
    const day = addDays(from, offset)
    if (day > story.end_date) return null
    if (story.weekdays & (WEEKDAY_BITS_BY_DAY[parseDate(day).getDay()] ?? 0)) return day
  }
  return null
}

function formatDay(date: string): string {
  return parseDate(date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * assessRestore explains what restoring a deleted story does. Babbel restores
 * it with its old status and planning, so an active story is eligible for
 * bulletins again at once: an embargoed story can leak that way.
 * `today` is a local YYYY-MM-DD date.
 */
export function assessRestore(
  story: RestoreStory,
  today: string = toLocalDateString()
): RestoreAssessment {
  const notices: RestoreNotice[] = []
  let suggestion: RestoreAssessment['suggestion'] = null

  const ended = !!story.end_date && story.end_date < today

  if (ended || story.status === 'expired') {
    suggestion = 'reschedule'
    notices.push({
      tone: 'warning',
      message: ended
        ? `De uitzendperiode is voorbij (laatste dag ${formatDate(story.end_date)}). Pas de planning aan om het bericht weer te gebruiken.`
        : 'Het bericht staat op verlopen. Pas de planning en status aan om het weer te gebruiken.',
    })
  } else if (story.status === 'active') {
    const day = firstBroadcastDay(story, today)
    if (day && story.audio_file) {
      suggestion = 'draft'
      notices.push({
        tone: 'warning',
        message: `${
          day === today
            ? 'Het bericht is actief en kan direct na herstellen weer in bulletins komen'
            : `Het bericht is actief en kan vanaf ${formatDay(day)} weer in bulletins komen`
        }, met de planning van vóór het verwijderen. Controleer of die en een eventueel embargo nog kloppen, of herstel het als concept.`,
      })
    } else if (day) {
      notices.push({
        tone: 'info',
        message: `Het bericht is actief maar heeft geen audio. Zodra er audio is, kan het ${
          day === today ? 'direct' : `vanaf ${formatDay(day)}`
        } in bulletins komen.`,
      })
    }
  } else if (story.status === 'draft') {
    notices.push({
      tone: 'info',
      message: 'Het bericht is een concept en komt pas in bulletins als je het op actief zet.',
    })
  }

  const postId = wordpressPostId(story)
  if (postId) {
    notices.push({
      tone: 'info',
      message: `Dit bericht komt uit WordPress (post ${postId}). Herstellen in Knabbel werkt de WordPress-plugin niet bij: een update die mislukte terwijl het bericht verwijderd was, wordt niet opnieuw verstuurd. Controleer de planning tegen het artikel in WordPress.`,
    })
  }

  return { suggestion, notices }
}
