import type { FieldError, ProblemDetails as ApiProblemDetails } from './generated/types.gen'

// Response bodies are untrusted, so every member is optional and `code` stays
// a plain string until it is looked up.
type ProblemFieldError = Partial<Pick<FieldError, 'field' | 'message'>> & { code?: string }

type ProblemDetails = Partial<Pick<ApiProblemDetails, 'code' | 'detail' | 'hint'>> & {
  errors?: ProblemFieldError[]
}

export const UPLOAD_TIMEOUT_MESSAGE = 'Upload duurde te lang'

// Problem `code` values and bulletin job error codes share this table. Babbel's
// detail text is English and meant for logs, so the UI shows its own copy per code.
const problemMessages: Record<string, string> = {
  'audio.processing_failed': 'Audio verwerken mislukt',
  'bulletin.no_stories': 'Geen actieve berichten met audio voor deze zender',
  'internal.generation_failed': 'Bulletin genereren mislukt',
  'internal.retries_exhausted': 'Bulletin genereren mislukt na meerdere pogingen',
  'internal.timeout': 'De server deed er te lang over',
  'story.audio_exists': 'Dit bericht heeft al audio',
  'story.deleted': 'Dit bericht is verwijderd',
  'story.no_text': 'Het bericht heeft geen tekst',
  'story.no_voice': 'Het bericht heeft geen stem',
  'story.tts_text_too_long': 'De tekst is te lang voor spraakgeneratie',
  'tts.not_configured': 'Spraakgeneratie is niet geconfigureerd',
  'tts.rate_limited': 'Limiet van ElevenLabs bereikt, probeer het later opnieuw',
  'tts.upstream_failed': 'ElevenLabs gaf een fout, probeer het later opnieuw',
  'user.last_admin': 'De laatste beheerder kan niet worden verwijderd, gedegradeerd of geschorst',
  'voice.elevenlabs_not_found': 'ElevenLabs kent de voice ID van deze stem niet',
  'voice.no_elevenlabs_id': 'De stem heeft geen ElevenLabs voice ID',
}

// Resource-specific codes follow `{resource}.{error_type}`.
const problemSuffixMessages: Record<string, string> = {
  duplicate: 'Bestaat al',
  has_dependencies: 'Nog in gebruik, ontkoppel of verwijder eerst de gekoppelde items',
  reference_missing: 'Een gekoppeld item is intussen verwijderd, herlaad de pagina',
}

const statusMessages: Record<number, string> = {
  408: UPLOAD_TIMEOUT_MESSAGE,
  413: 'Bestand of verzoek is te groot',
}

// Field copy leaves out the field name; toasts add it as a label. date_order names
// both dates instead, because Babbel reports it on start_date or end_date.
const fieldErrorMessages: Record<FieldError['code'], string> = {
  required: 'Verplicht',
  blank: 'Mag niet leeg zijn',
  too_short: 'Te kort',
  too_long: 'Te lang',
  out_of_range: 'Buiten het toegestane bereik',
  invalid_format: 'Ongeldig formaat',
  invalid_choice: 'Ongeldige keuze',
  invalid_type: 'Ongeldig type',
  invalid_json: 'Ongeldig verzoek',
  unknown_field: 'Onbekend veld',
  not_found: 'Bestaat niet (meer)',
  date_order: 'Einddatum ligt voor de startdatum',
  empty_update: 'Geen wijzigingen',
  duplicate: 'Dubbele invoer',
  unsupported: 'Niet ondersteund',
  silent_audio: 'Stil of te zacht, controleer het opnameniveau',
}

const fieldLabels: Record<string, string> = {
  audio: 'Audiobestand',
  elevenlabs_voice_id: 'ElevenLabs voice ID',
  email: 'E-mail',
  end_date: 'Einddatum',
  full_name: 'Volledige naam',
  jingle: 'Jingle',
  max_stories_per_block: 'Max. berichten per blok',
  mix_point: 'Mixpunt',
  name: 'Naam',
  password: 'Wachtwoord',
  pause_seconds: 'Pauze',
  role: 'Rol',
  start_date: 'Startdatum',
  station_id: 'Zender',
  status: 'Status',
  text: 'Tekst',
  title: 'Titel',
  username: 'Gebruikersnaam',
  voice_id: 'Stem',
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isProblemFieldError(value: unknown): value is ProblemFieldError {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    isOptionalString(candidate.field) &&
    isOptionalString(candidate.code) &&
    isOptionalString(candidate.message)
  )
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return (
    isOptionalString(candidate.code) &&
    isOptionalString(candidate.detail) &&
    isOptionalString(candidate.hint) &&
    (candidate.errors === undefined ||
      (Array.isArray(candidate.errors) && candidate.errors.every(isProblemFieldError)))
  )
}

/** describeProblemCode returns Dutch copy for a Babbel problem or job error code. */
export function describeProblemCode(code: string | undefined): string | undefined {
  if (!code) return undefined
  return problemMessages[code] ?? problemSuffixMessages[code.slice(code.lastIndexOf('.') + 1)]
}

/** describeFieldError returns Dutch copy for one `errors[]` item, without a field label. */
export function describeFieldError(error: ProblemFieldError): string | undefined {
  if (error.field === 'password' && error.code === 'invalid_format') {
    // The password policy is server configuration; its message names the missing class.
    return `Voldoet niet aan het wachtwoordbeleid${error.message ? ` (${error.message})` : ''}`
  }
  return fieldErrorMessages[error.code as FieldError['code']] ?? error.message
}

/** describeProblem turns Problem Details into a Dutch message, or undefined when nothing fits. */
export function describeProblem(status: number, problem: ProblemDetails): string | undefined {
  // tts.upstream_failed is a 502, except a 503 when ElevenLabs rejects the API credentials.
  if (problem.code === 'tts.upstream_failed' && status === 503) {
    return 'ElevenLabs weigert de API-sleutel, controleer de configuratie'
  }

  const codeMessage = describeProblemCode(problem.code)
  if (codeMessage) return codeMessage

  const statusMessage = statusMessages[status]
  if (statusMessage) return statusMessage

  const [first] = problem.errors ?? []
  if (first) {
    const message = describeFieldError(first)
    const label = first.field && first.code !== 'date_order' ? fieldLabels[first.field] : undefined
    if (message) return label ? `${label}: ${message[0].toLowerCase()}${message.slice(1)}` : message
  }

  return undefined
}

/**
 * fieldErrorsFromProblem maps `errors[]` to one Dutch message per form field.
 * Forms show them in the same inline slots as their own Zod errors.
 */
export function fieldErrorsFromProblem(problem: ProblemDetails): Record<string, string> {
  const result: Record<string, string> = {}
  for (const error of problem.errors ?? []) {
    const message = describeFieldError(error)
    if (error.field && message && !result[error.field]) {
      result[error.field] = message
    }
  }
  return result
}
