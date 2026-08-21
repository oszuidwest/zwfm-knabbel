import type { CurrentSession } from '$lib/api/generated/types.gen'

type Permissions = CurrentSession['permissions']

export type Resource = keyof Permissions
export type Action<R extends Resource> = NonNullable<Permissions[R]>[number]

export function can<R extends Resource>(
  session: CurrentSession | null | undefined,
  resource: R,
  action: Action<R>
): boolean {
  const actions = session?.permissions[resource] as readonly string[] | undefined
  return actions?.includes(action) ?? false
}
