import { WEEKDAY_BITS_BY_DAY, type Story } from '#lib/types/index.js'
import { formatDate, parseDate, toLocalDateString } from './format'

type RestoreStory = Pick<Story, 'status' | 'start_date' | 'end_date' | 'weekdays' | 'audio_file'>

interface RestoreAssessment {
  suggestion: 'edit' | 'draft' | null
  notice?: { tone: 'warning' | 'info'; message: string }
}

function firstBroadcastDay(story: RestoreStory, today: string): string | null {
  if (!story.start_date || !story.end_date) return null
  const date = parseDate(story.start_date > today ? story.start_date : today)
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
 * Babbel preserves status and planning on restore; active stories may air immediately.
 * `today` is local YYYY-MM-DD.
 */
export function assessRestore(
  story: RestoreStory,
  today: string = toLocalDateString()
): RestoreAssessment {
  if (story.end_date && story.end_date < today) {
    return {
      suggestion: 'edit',
      notice: {
        tone: 'warning',
        message: `De uitzendperiode is voorbij (laatste dag ${formatDate(story.end_date)}). Pas de planning aan om het bericht weer te gebruiken.`,
      },
    }
  }
  if (story.status === 'expired') {
    return {
      suggestion: 'edit',
      notice: {
        tone: 'warning',
        message:
          'Het bericht staat op verlopen. Pas de planning en status aan om het weer te gebruiken.',
      },
    }
  }
  if (story.status === 'draft') {
    return {
      suggestion: null,
      notice: {
        tone: 'info',
        message: 'Het bericht is een concept en komt pas in bulletins als je het op actief zet.',
      },
    }
  }

  const day = firstBroadcastDay(story, today)
  if (!day) return { suggestion: null }
  const when = day === today ? 'direct' : `vanaf ${formatDay(day)}`
  if (!story.audio_file) {
    return {
      suggestion: null,
      notice: {
        tone: 'info',
        message: `Het bericht is actief maar heeft geen audio. Zodra er audio is, kan het ${when} in bulletins komen.`,
      },
    }
  }
  return {
    suggestion: 'draft',
    notice: {
      tone: 'warning',
      message: `Het bericht is actief en kan ${day === today ? 'direct na herstellen' : when} weer in bulletins komen, met de planning van vóór het verwijderen. Controleer of die en een eventueel embargo nog kloppen, of herstel het als concept.`,
    },
  }
}
