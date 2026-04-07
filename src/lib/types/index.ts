export type * from './api'

import type { components } from './api'

export type User = components['schemas']['User']
export type UserInput = components['schemas']['UserInput']
export type Story = components['schemas']['Story']
export type Voice = components['schemas']['Voice']
export interface VoiceInput {
  name: string
}
export type Station = components['schemas']['Station']
export type StationInput = components['schemas']['StationInput']
export type StationVoice = components['schemas']['StationVoice']
export type Bulletin = components['schemas']['BulletinResponse']

export interface StationConfig {
  station: Station
  enabled: boolean
  stationVoiceId: number | null
  mixPoint: number
  audioUrl: string | null
  hasAudio: boolean
  jingleFile: File | null
  saving: boolean
}

// UI uses Weekdays booleans, service converts to bitmask for API
export interface Weekdays {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

// Bitmask values: Sunday=1, Monday=2, Tuesday=4, Wed=8, Thu=16, Fri=32, Sat=64
export const WEEKDAY_BITS = {
  sunday: 1,
  monday: 2,
  tuesday: 4,
  wednesday: 8,
  thursday: 16,
  friday: 32,
  saturday: 64,
} as const

/** Indexed by JavaScript day number (0=Sunday, 1=Monday, etc.) */
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
