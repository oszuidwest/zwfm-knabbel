import { WEEKDAY_BITS_BY_DAY, type Story } from '$lib/types'
import { formatDate, parseDate, toLocalDateString } from './format'

type RestoreStory = Pick<Story, 'status' | 'start_date' | 'end_date' | 'weekdays' | 'audio_file'>

interface RestoreAssessment {
  /**
   * The safer way to restore, offered as the primary action: `edit` when the
   * planning is over, `draft` when the story would reach bulletins.
   */
  suggestion: 'edit' | 'draft' | null
  notices: { tone: 'warning' | 'info'; message: string }[]
}

/**
 * firstBroadcastDay returns the first day from `today` on which Babbel's
 * bulletin selection matches the story's period and weekdays, or null.
 */
function firstBroadcastDay(story: RestoreStory, today: string): string | null {
  if (!story.start_date || !story.end_date) return null
  const date = parseDate(story.start_date > today ? story.start_date : today)
  // Seven consecutive days cover every weekday once.
  for (let i = 0; i < 7; i++, date.setDate(date.getDate() + 1)) {
    const day = toLocalDateString(date)
    if (day > story.end_date) return null
    if (story.weekdays & (WEEKDAY_BITS_BY_DAY[date.getDay()] ?? 0)) return day
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
  const notices: RestoreAssessment['notices'] = []
  let suggestion: RestoreAssessment['suggestion'] = null

  const ended = !!story.end_date && story.end_date < today

  if (ended || story.status === 'expired') {
    suggestion = 'edit'
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

  return { suggestion, notices }
}
