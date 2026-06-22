import { z } from 'zod'

export const storySchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  text: z.string().min(1, 'Tekst is verplicht'),
  // Keep voice_id as select-compatible form state until storiesApi.toApiFormat.
  voice_id: z.string().nullable().default(''),
  status: z.enum(['draft', 'active', 'expired']),
  start_date: z.string().min(1, 'Startdatum is verplicht'),
  end_date: z.string().min(1, 'Einddatum is verplicht'),
  weekdays: z.object({
    monday: z.boolean(),
    tuesday: z.boolean(),
    wednesday: z.boolean(),
    thursday: z.boolean(),
    friday: z.boolean(),
    saturday: z.boolean(),
    sunday: z.boolean(),
  }),
  is_breaking: z.boolean(),
})

export type StoryFormData = z.infer<typeof storySchema>
