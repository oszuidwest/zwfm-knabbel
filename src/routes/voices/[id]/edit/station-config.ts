import type { Station } from '$lib/types'

export interface StationConfig {
  station: Station
  enabled: boolean
  stationVoiceId: number | null
  mixPoint: number
  savedMixPoint: number
  audioUrl: string | null
  hasAudio: boolean
  jingleFile: File | null
  saving: boolean
}
