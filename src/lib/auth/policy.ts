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
type _PolicyRoles<R extends Resource, A extends Action<R>> = ((typeof POLICY)[R][A] &
  readonly Role[])[number]
type _AllowsExactly<
  R extends Resource,
  A extends Action<R>,
  Allowed extends readonly Role[],
  Denied extends readonly Role[],
> =
  Exclude<Role, Allowed[number] | Denied[number]> extends never
    ? Exclude<Allowed[number], _PolicyRoles<R, A>> extends never
      ? Exclude<_PolicyRoles<R, A>, Allowed[number]> extends never
        ? Extract<Denied[number], _PolicyRoles<R, A>> extends never
          ? true
          : false
        : false
      : false
    : false

type _StationsRead = _Assert<_AllowsExactly<'stations', 'read', ['admin', 'editor', 'viewer'], []>>
type _StationsWrite = _Assert<_AllowsExactly<'stations', 'write', ['admin', 'editor'], ['viewer']>>
type _VoicesRead = _Assert<_AllowsExactly<'voices', 'read', ['admin', 'editor', 'viewer'], []>>
type _VoicesWrite = _Assert<_AllowsExactly<'voices', 'write', ['admin', 'editor'], ['viewer']>>
type _StoriesRead = _Assert<_AllowsExactly<'stories', 'read', ['admin', 'editor', 'viewer'], []>>
type _StoriesWrite = _Assert<_AllowsExactly<'stories', 'write', ['admin', 'editor'], ['viewer']>>
type _BulletinsRead = _Assert<
  _AllowsExactly<'bulletins', 'read', ['admin', 'editor', 'viewer'], []>
>
type _BulletinsGenerate = _Assert<
  _AllowsExactly<'bulletins', 'generate', ['admin', 'editor'], ['viewer']>
>
type _UsersRead = _Assert<_AllowsExactly<'users', 'read', ['admin', 'editor'], ['viewer']>>
type _UsersWrite = _Assert<_AllowsExactly<'users', 'write', ['admin'], ['editor', 'viewer']>>
type _SettingsTtsRead = _Assert<
  _AllowsExactly<'settings_tts', 'read', ['admin', 'editor', 'viewer'], []>
>
type _SettingsTtsWrite = _Assert<
  _AllowsExactly<'settings_tts', 'write', ['admin'], ['editor', 'viewer']>
>
type _PronunciationRulesRead = _Assert<
  _AllowsExactly<'pronunciation_rules', 'read', ['admin', 'editor', 'viewer'], []>
>
type _PronunciationRulesWrite = _Assert<
  _AllowsExactly<'pronunciation_rules', 'write', ['admin', 'editor'], ['viewer']>
>
