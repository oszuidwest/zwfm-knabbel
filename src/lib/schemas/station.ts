import { z } from 'zod'

export const stationSchema = z.object({
  name: z.string().min(1, 'Naam is verplicht'),
  max_stories_per_block: z.number().min(1, 'Minimaal 1 bericht').max(20, 'Maximaal 20 berichten'),
  pause_seconds: z
    .number()
    .min(0, 'Pauze kan niet negatief zijn')
    .max(10, 'Maximaal 10 seconden pauze'),
})

export type StationFormData = z.infer<typeof stationSchema>
