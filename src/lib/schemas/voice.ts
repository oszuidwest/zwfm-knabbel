import { z } from 'zod'

export const voiceSchema = z.object({
  name: z.string().trim().min(1, 'Naam is verplicht'),
  elevenlabs_voice_id: z.string().trim(),
})

export type VoiceFormData = z.infer<typeof voiceSchema>
