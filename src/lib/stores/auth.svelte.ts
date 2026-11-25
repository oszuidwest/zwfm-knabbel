import { createContext } from 'svelte'
import { deleteSessionsCurrent } from '#lib/api/generated/sdk.gen.js'
import { can as sessionCan, type Action, type Resource } from '#lib/auth/policy.js'
import type { Session } from '#lib/types/index.js'

export class AuthStore {
  user = $state<Session | null>(null)

  constructor(user: Session | null) {
    this.user = user
  }

  hydrate(user: Session | null): void {
    this.user = user
  }

  can<R extends Resource>(resource: R, action: Action<R>): boolean {
    return sessionCan(this.user, resource, action)
  }

  async logout(): Promise<void> {
    try {
      await deleteSessionsCurrent()
    } catch (err) {
      console.warn('[auth] logout failed', err)
    }
    this.hydrate(null)
  }
}

export const [getAuthContext, setAuthContext] = createContext<AuthStore>()

export function createAuthStore(user: Session | null): AuthStore {
  return new AuthStore(user)
}
