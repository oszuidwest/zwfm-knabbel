import type { TTSSettings, TTSSettingsUpdate } from '$lib/types'
import { z } from 'zod'

const ttsModelValues = ['eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5'] as const
const textNormalizationValues = ['auto', 'on', 'off'] as const

export const ttsModelOptions = [
  { value: ttsModelValues[0], label: 'Eleven v3' },
  { value: ttsModelValues[1], label: 'Eleven Multilingual v2' },
  { value: ttsModelValues[2], label: 'Eleven Flash v2.5' },
] satisfies readonly { value: (typeof ttsModelValues)[number]; label: string }[]

export const textNormalizationOptions = [
  { value: textNormalizationValues[0], label: 'Auto' },
  { value: textNormalizationValues[1], label: 'Aan' },
  { value: textNormalizationValues[2], label: 'Uit' },
] satisfies readonly { value: (typeof textNormalizationValues)[number]; label: string }[]

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
  model: z.enum(ttsModelValues, { error: 'Model is verplicht' }),
  stability: z.number().min(0, 'Minimaal 0').max(1, 'Maximaal 1'),
  similarity_boost: z.number().min(0, 'Minimaal 0').max(1, 'Maximaal 1'),
  style: z.number().min(0, 'Minimaal 0').max(1, 'Maximaal 1'),
  use_speaker_boost: z.boolean(),
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
    model: settings.model,
    stability: settings.stability,
    similarity_boost: settings.similarity_boost,
    style: settings.style,
    use_speaker_boost: settings.use_speaker_boost,
    speed: settings.speed,
    apply_text_normalization: settings.apply_text_normalization,
    seed: settings.seed == null ? '' : String(settings.seed),
    tts_style_prefix: settings.tts_style_prefix,
  }
}

export function toTTSSettingsUpdate(form: TTSSettingsFormData): TTSSettingsUpdate {
  return {
    model: form.model,
    stability: form.stability,
    similarity_boost: form.similarity_boost,
    style: form.style,
    use_speaker_boost: form.use_speaker_boost,
    speed: form.speed,
    apply_text_normalization: form.apply_text_normalization,
    seed: form.seed === '' ? null : Number(form.seed),
    tts_style_prefix: form.tts_style_prefix,
  }
}
