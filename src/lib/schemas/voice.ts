import { z } from 'zod'

export const voiceSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
})

export type VoiceFormData = z.infer<typeof voiceSchema>
