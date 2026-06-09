import { z } from 'zod'

const hasControlCharacter = (value: string): boolean =>
  [...value].some(char => {
    const code = char.charCodeAt(0)
    return code < 32 || code === 127
  })

export const pronunciationRuleSchema = z.object({
  string_to_replace: z.string().trim().min(1, 'Woord is verplicht'),
  ipa: z
    .string()
    .trim()
    .min(1, 'IPA is verplicht')
    .max(255, 'Maximaal 255 tekens')
    .refine(value => !value.includes('/'), 'Gebruik IPA zonder schuine strepen')
    .refine(value => !hasControlCharacter(value), 'Controlekarakters zijn niet toegestaan'),
  case_sensitive: z.boolean(),
  word_boundaries: z.boolean(),
})

export const pronunciationRulesSchema = z
  .object({
    rules: z.array(pronunciationRuleSchema).max(1000, 'Maximaal 1000 regels toegestaan'),
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

export const pronunciationRuleFieldNames = [
  'string_to_replace',
  'ipa',
  'case_sensitive',
  'word_boundaries',
] as const

export type PronunciationRuleField = (typeof pronunciationRuleFieldNames)[number]

const pronunciationRuleFieldSet = new Set<string>(pronunciationRuleFieldNames)

export function isPronunciationRuleField(field: string): field is PronunciationRuleField {
  return pronunciationRuleFieldSet.has(field)
}
