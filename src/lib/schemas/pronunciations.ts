import { z } from 'zod'

export const pronunciationRuleSchema = z.object({
  string_to_replace: z.string().trim().min(1, 'Woord is verplicht'),
  alias: z.string().trim().min(1, 'Uitspraak is verplicht'),
  case_sensitive: z.boolean(),
  word_boundaries: z.boolean(),
})

export const pronunciationRulesSchema = z
  .object({
    rules: z.array(pronunciationRuleSchema).max(5000, 'Maximaal 5000 regels toegestaan'),
  })
  .superRefine((data, ctx) => {
    const seen = new Map<string, number>()
    data.rules.forEach((rule, i) => {
      const key = rule.string_to_replace.trim()
      if (!key) return
      const prev = seen.get(key)
      if (prev !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['rules', i, 'string_to_replace'],
          message: `Dubbele invoer (zelfde als regel ${prev + 1})`,
        })
      } else {
        seen.set(key, i)
      }
    })
  })

export type PronunciationRuleFormData = z.infer<typeof pronunciationRuleSchema>
