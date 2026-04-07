import { z } from 'zod'

export const storySchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  text: z.string().min(1, 'Tekst is verplicht'),
  // voice_id is stored as string in form (HTML select returns strings)
  // Converted to number in storiesApi.toApiFormat before submission
  // Default to empty string to handle undefined from partial form data
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
