import { z } from 'zod'

export const voiceSchema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht'),
  // Empty means unlinked; Babbel rejects other values outside this pattern.
  elevenlabs_voice_id: z
    .string()
    .trim()
    .regex(/^([A-Za-z0-9_-]{8,64})?$/, '8 tot 64 letters, cijfers, - of _'),
})

export type VoiceFormData = z.infer<typeof voiceSchema>
