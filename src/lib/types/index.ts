import type { PostVoicesData } from '$lib/api/generated/types.gen'

export type {
  BulletinResponse as Bulletin,
  CurrentSession as Session,
  PronunciationRule,
  PronunciationRulesList,
  PronunciationRulesUpdate,
  Station,
  StationInput,
  StationVoice,
  Story,
  TTSSettings,
  TTSSettingsUpdate,
  User,
  UserInputWritable as UserInput,
  UserUpdateWritable as UserUpdate,
  ValidationError,
  Voice,
} from '$lib/api/generated/types.gen'

export type VoiceInput = PostVoicesData['body']

/** Weekdays stores schedule state in the shape forms can bind directly. */
export interface Weekdays {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

/** WEEKDAY_BITS maps form weekday keys to the API bitmask contract. */
export const WEEKDAY_BITS = {
  sunday: 1,
  monday: 2,
  tuesday: 4,
  wednesday: 8,
  thursday: 16,
  friday: 32,
  saturday: 64,
} as const

/** WEEKDAY_BITS_BY_DAY is indexed by JavaScript day number, where Sunday is 0. */
export const WEEKDAY_BITS_BY_DAY: Record<number, number> = {
  0: WEEKDAY_BITS.sunday,
  1: WEEKDAY_BITS.monday,
  2: WEEKDAY_BITS.tuesday,
  3: WEEKDAY_BITS.wednesday,
  4: WEEKDAY_BITS.thursday,
  5: WEEKDAY_BITS.friday,
  6: WEEKDAY_BITS.saturday,
}

export const weekdaysToMask = (weekdays: Weekdays): number => {
  let mask = 0
  if (weekdays.sunday) mask |= WEEKDAY_BITS.sunday
  if (weekdays.monday) mask |= WEEKDAY_BITS.monday
  if (weekdays.tuesday) mask |= WEEKDAY_BITS.tuesday
  if (weekdays.wednesday) mask |= WEEKDAY_BITS.wednesday
  if (weekdays.thursday) mask |= WEEKDAY_BITS.thursday
  if (weekdays.friday) mask |= WEEKDAY_BITS.friday
  if (weekdays.saturday) mask |= WEEKDAY_BITS.saturday
  return mask
}

export const maskToWeekdays = (mask: number): Weekdays => ({
  sunday: (mask & WEEKDAY_BITS.sunday) !== 0,
  monday: (mask & WEEKDAY_BITS.monday) !== 0,
  tuesday: (mask & WEEKDAY_BITS.tuesday) !== 0,
  wednesday: (mask & WEEKDAY_BITS.wednesday) !== 0,
  thursday: (mask & WEEKDAY_BITS.thursday) !== 0,
  friday: (mask & WEEKDAY_BITS.friday) !== 0,
  saturday: (mask & WEEKDAY_BITS.saturday) !== 0,
})

export const allWeekdaysTrue = (): Weekdays => ({
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
})
