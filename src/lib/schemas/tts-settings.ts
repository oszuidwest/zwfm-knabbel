import type { TTSSettings, TTSSettingsUpdate } from '$lib/types'
import { z } from 'zod'

const textNormalizationValues = ['auto', 'on', 'off'] as const

export const textNormalizationOptions = [
  { value: textNormalizationValues[0], label: 'Auto' },
  { value: textNormalizationValues[1], label: 'Aan' },
  { value: textNormalizationValues[2], label: 'Uit' },
] satisfies readonly { value: (typeof textNormalizationValues)[number]; label: string }[]

// ElevenLabs seed range: 0..2^32-1.
const uint32Max = 4294967295

const seedSchema = z
  .string()
  .trim()
  .refine(value => value === '' || /^\d+$/.test(value), 'Seed moet een geheel getal zijn')
  .refine(
    value => value === '' || Number(value) <= uint32Max,
    `Seed mag maximaal ${uint32Max} zijn`
  )

export const ttsSettingsSchema = z.object({
  stability: z.number().min(0, 'Minimaal 0').max(1, 'Maximaal 1'),
  similarity_boost: z.number().min(0, 'Minimaal 0').max(1, 'Maximaal 1'),
  style: z.number().min(0, 'Minimaal 0').max(1, 'Maximaal 1'),
  speed: z.number().min(0.7, 'Minimaal 0.7').max(1.2, 'Maximaal 1.2'),
  apply_text_normalization: z.enum(textNormalizationValues, {
    error: 'Tekstnormalisatie is verplicht',
  }),
  seed: seedSchema,
  tts_style_prefix: z.string().max(500, 'Maximaal 500 tekens'),
})

export type TTSSettingsFormData = z.infer<typeof ttsSettingsSchema>

export function toTTSSettingsFormData(settings: TTSSettings): TTSSettingsFormData {
  return {
    stability: settings.stability,
    similarity_boost: settings.similarity_boost,
    style: settings.style,
    speed: settings.speed,
    apply_text_normalization: settings.apply_text_normalization,
    seed: settings.seed == null ? '' : String(settings.seed),
    tts_style_prefix: settings.tts_style_prefix,
  }
}

export function toTTSSettingsUpdate(form: TTSSettingsFormData): TTSSettingsUpdate {
  return {
    ...form,
    seed: form.seed === '' ? null : Number(form.seed),
  }
}
