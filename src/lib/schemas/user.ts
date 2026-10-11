import { z } from 'zod'

// Babbel stores bcrypt hashes, which only use the first 72 bytes of a password.
const PASSWORD_MAX_BYTES = 72

export const userSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Gebruikersnaam is verplicht')
      .min(3, 'Minimaal 3 tekens')
      .regex(/^[a-zA-Z0-9]+$/, 'Alleen letters en cijfers toegestaan'),
    full_name: z.string().min(1, 'Volledige naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
    password: z
      .string()
      // Babbel counts characters as code points, not UTF-16 units.
      .refine(value => !value || [...value].length >= 8, 'Minimaal 8 tekens')
      .refine(
        value => new TextEncoder().encode(value).length <= PASSWORD_MAX_BYTES,
        `Maximaal ${PASSWORD_MAX_BYTES} tekens (minder met speciale tekens)`
      )
      .optional(),
    confirmPassword: z.string().optional(),
    role: z.enum(['admin', 'editor', 'viewer'], {
      error: 'Rol is verplicht',
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
