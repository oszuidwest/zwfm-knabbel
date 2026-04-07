import { z } from 'zod'

export const userSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Gebruikersnaam is verplicht')
      .regex(/^[a-zA-Z0-9]+$/, 'Alleen letters en cijfers toegestaan'),
    full_name: z.string().min(1, 'Volledige naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    role: z.enum(['admin', 'editor', 'viewer'], {
      required_error: 'Rol is verplicht',
    }),
  })
  .refine(
    data => {
      if (data.password && data.password !== data.confirmPassword) {
        return false
      }
      return true
    },
    {
      message: 'Wachtwoorden komen niet overeen',
      path: ['confirmPassword'],
    }
  )

export const userCreateSchema = userSchema.refine(data => !!data.password, {
  message: 'Wachtwoord is verplicht',
  path: ['password'],
})

export type UserFormData = z.infer<typeof userSchema>
