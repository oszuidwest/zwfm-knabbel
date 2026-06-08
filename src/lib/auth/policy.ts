export type Role = 'admin' | 'editor' | 'viewer'

// Mirrors zwfm-babbel/internal/auth/service.go initializeRBAC.
export const POLICY = {
  stations: { read: ['admin', 'editor', 'viewer'], write: ['admin', 'editor'] },
  voices: { read: ['admin', 'editor', 'viewer'], write: ['admin', 'editor'] },
  stories: { read: ['admin', 'editor', 'viewer'], write: ['admin', 'editor'] },
  bulletins: { read: ['admin', 'editor', 'viewer'], generate: ['admin', 'editor'] },
  users: { read: ['admin', 'editor'], write: ['admin'] },
  settings_tts: { read: ['admin', 'editor', 'viewer'], write: ['admin'] },
  pronunciation_rules: { read: ['admin', 'editor', 'viewer'], write: ['admin', 'editor'] },
} as const satisfies Record<string, Record<string, readonly Role[]>>

export type Resource = keyof typeof POLICY
export type Action<R extends Resource> = keyof (typeof POLICY)[R]

export function can<R extends Resource>(
  role: Role | undefined,
  resource: R,
  action: Action<R>
): boolean {
  if (!role) return false
  const allowed = POLICY[resource][action] as readonly Role[]
  return allowed.includes(role)
}

type _Assert<T extends true> = T

type _AdminCanReadStations = _Assert<
  'admin' extends (typeof POLICY.stations.read)[number] ? true : false
>
type _EditorCanReadStations = _Assert<
  'editor' extends (typeof POLICY.stations.read)[number] ? true : false
>
type _ViewerCanReadStations = _Assert<
  'viewer' extends (typeof POLICY.stations.read)[number] ? true : false
>
type _AdminCanWriteStations = _Assert<
  'admin' extends (typeof POLICY.stations.write)[number] ? true : false
>
type _EditorCanWriteStations = _Assert<
  'editor' extends (typeof POLICY.stations.write)[number] ? true : false
>
type _ViewerCannotWriteStations = _Assert<
  'viewer' extends (typeof POLICY.stations.write)[number] ? false : true
>

type _AdminCanReadVoices = _Assert<
  'admin' extends (typeof POLICY.voices.read)[number] ? true : false
>
type _EditorCanReadVoices = _Assert<
  'editor' extends (typeof POLICY.voices.read)[number] ? true : false
>
type _ViewerCanReadVoices = _Assert<
  'viewer' extends (typeof POLICY.voices.read)[number] ? true : false
>
type _AdminCanWriteVoices = _Assert<
  'admin' extends (typeof POLICY.voices.write)[number] ? true : false
>
type _EditorCanWriteVoices = _Assert<
  'editor' extends (typeof POLICY.voices.write)[number] ? true : false
>
type _ViewerCannotWriteVoices = _Assert<
  'viewer' extends (typeof POLICY.voices.write)[number] ? false : true
>

type _AdminCanReadStories = _Assert<
  'admin' extends (typeof POLICY.stories.read)[number] ? true : false
>
type _EditorCanReadStories = _Assert<
  'editor' extends (typeof POLICY.stories.read)[number] ? true : false
>
type _ViewerCanReadStories = _Assert<
  'viewer' extends (typeof POLICY.stories.read)[number] ? true : false
>
type _AdminCanWriteStories = _Assert<
  'admin' extends (typeof POLICY.stories.write)[number] ? true : false
>
type _EditorCanWriteStories = _Assert<
  'editor' extends (typeof POLICY.stories.write)[number] ? true : false
>
type _ViewerCannotWriteStories = _Assert<
  'viewer' extends (typeof POLICY.stories.write)[number] ? false : true
>

type _AdminCanReadBulletins = _Assert<
  'admin' extends (typeof POLICY.bulletins.read)[number] ? true : false
>
type _EditorCanReadBulletins = _Assert<
  'editor' extends (typeof POLICY.bulletins.read)[number] ? true : false
>
type _ViewerCanReadBulletins = _Assert<
  'viewer' extends (typeof POLICY.bulletins.read)[number] ? true : false
>
type _AdminCanGenerateBulletins = _Assert<
  'admin' extends (typeof POLICY.bulletins.generate)[number] ? true : false
>
type _EditorCanGenerateBulletins = _Assert<
  'editor' extends (typeof POLICY.bulletins.generate)[number] ? true : false
>
type _ViewerCannotGenerateBulletins = _Assert<
  'viewer' extends (typeof POLICY.bulletins.generate)[number] ? false : true
>

type _AdminCanReadUsers = _Assert<'admin' extends (typeof POLICY.users.read)[number] ? true : false>
type _EditorCanReadUsers = _Assert<
  'editor' extends (typeof POLICY.users.read)[number] ? true : false
>
type _ViewerCannotReadUsers = _Assert<
  'viewer' extends (typeof POLICY.users.read)[number] ? false : true
>
type _AdminCanWriteUsers = _Assert<
  'admin' extends (typeof POLICY.users.write)[number] ? true : false
>
type _EditorCannotWriteUsers = _Assert<
  'editor' extends (typeof POLICY.users.write)[number] ? false : true
>
type _ViewerCannotWriteUsers = _Assert<
  'viewer' extends (typeof POLICY.users.write)[number] ? false : true
>

type _AdminCanReadSettingsTts = _Assert<
  'admin' extends (typeof POLICY.settings_tts.read)[number] ? true : false
>
type _EditorCanReadSettingsTts = _Assert<
  'editor' extends (typeof POLICY.settings_tts.read)[number] ? true : false
>
type _ViewerCanReadSettingsTts = _Assert<
  'viewer' extends (typeof POLICY.settings_tts.read)[number] ? true : false
>
type _AdminCanWriteSettingsTts = _Assert<
  'admin' extends (typeof POLICY.settings_tts.write)[number] ? true : false
>
type _EditorCannotWriteSettingsTts = _Assert<
  'editor' extends (typeof POLICY.settings_tts.write)[number] ? false : true
>
type _ViewerCannotWriteSettingsTts = _Assert<
  'viewer' extends (typeof POLICY.settings_tts.write)[number] ? false : true
>

type _AdminCanReadPronunciationRules = _Assert<
  'admin' extends (typeof POLICY.pronunciation_rules.read)[number] ? true : false
>
type _EditorCanReadPronunciationRules = _Assert<
  'editor' extends (typeof POLICY.pronunciation_rules.read)[number] ? true : false
>
type _ViewerCanReadPronunciationRules = _Assert<
  'viewer' extends (typeof POLICY.pronunciation_rules.read)[number] ? true : false
>
type _AdminCanWritePronunciationRules = _Assert<
  'admin' extends (typeof POLICY.pronunciation_rules.write)[number] ? true : false
>
type _EditorCanWritePronunciationRules = _Assert<
  'editor' extends (typeof POLICY.pronunciation_rules.write)[number] ? true : false
>
type _ViewerCannotWritePronunciationRules = _Assert<
  'viewer' extends (typeof POLICY.pronunciation_rules.write)[number] ? false : true
>
