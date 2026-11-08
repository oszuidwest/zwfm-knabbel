export type {
  BulletinResponse as Bulletin,
  CurrentSession as Session,
  PronunciationRule,
  PronunciationRulesList,
  PronunciationRulesUpdate,
  Station,
  StationVoice,
  Story,
  TTSSettings,
  TTSSettingsUpdate,
  User,
  UserUpdateWritable as UserUpdate,
  Voice,
} from '#lib/api/generated/types.gen.js'

export const WEEKDAY_BITS = {
  sunday: 1,
  monday: 2,
  tuesday: 4,
  wednesday: 8,
  thursday: 16,
  friday: 32,
  saturday: 64,
} as const

export type Weekdays = Record<keyof typeof WEEKDAY_BITS, boolean>

const weekdayBits = Object.entries(WEEKDAY_BITS) as [keyof Weekdays, number][]

/** Indexed by Date.getDay(): Sunday is 0. */
export const WEEKDAY_BITS_BY_DAY: Record<number, number> = {
  0: WEEKDAY_BITS.sunday,
  1: WEEKDAY_BITS.monday,
  2: WEEKDAY_BITS.tuesday,
  3: WEEKDAY_BITS.wednesday,
  4: WEEKDAY_BITS.thursday,
  5: WEEKDAY_BITS.friday,
  6: WEEKDAY_BITS.saturday,
}

export const weekdaysToMask = (weekdays: Weekdays): number =>
  weekdayBits.reduce((mask, [day, bit]) => (weekdays[day] ? mask | bit : mask), 0)

export const maskToWeekdays = (mask: number): Weekdays =>
  Object.fromEntries(weekdayBits.map(([day, bit]) => [day, (mask & bit) !== 0])) as Weekdays

export const allWeekdaysTrue = (): Weekdays => ({
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
})
