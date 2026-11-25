import { createContext } from 'svelte'
import { ApiError } from '#lib/api/client.js'
import {
  deleteSessionsCurrent,
  getSessionsCurrent,
  postSessions,
} from '#lib/api/generated/sdk.gen.js'
import { can as sessionCan, type Action, type Resource } from '#lib/auth/policy.js'
import type { Session } from '#lib/types/index.js'

interface CheckAuthOptions {
  force?: boolean
}

export class AuthStore {
  user = $state<Session | null>(null)
  checked = $state(false)

  private checkPromise: Promise<boolean> | null = null
  private logouts = 0

  constructor(initialUser?: Session | null) {
    if (initialUser !== undefined) {
      this.hydrate(initialUser)
    }
  }

  hydrate(user: Session | null): void {
    this.user = user
    this.checked = true
  }

  can<R extends Resource>(resource: R, action: Action<R>): boolean {
    return sessionCan(this.user, resource, action)
  }

  async checkAuth(options: CheckAuthOptions = {}): Promise<boolean> {
    if (this.checkPromise && !options.force) {
      return this.checkPromise
    }

    const promise = this.runCheckAuth()
    this.checkPromise = promise

    try {
      return await promise
    } finally {
      if (this.checkPromise === promise) {
        this.checkPromise = null
      }
    }
  }

  private async runCheckAuth(): Promise<boolean> {
    const logouts = this.logouts
    try {
      const user = await getSessionsCurrent()
      // A response from before a logout would sign the user in again.
      if (logouts !== this.logouts) return false
      this.user = user
      return true
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.error('[auth] checkAuth failed', err)
      }
      this.user = null
      return false
    } finally {
      this.checked = true
    }
  }

  async login(username: string, password: string): Promise<void> {
    await postSessions({ body: { username, password } })
    await this.checkAuth()
  }

  async logout(): Promise<void> {
    try {
      await deleteSessionsCurrent()
    } catch (err) {
      console.warn('[auth] logout failed', err)
    }
    this.logouts++
    this.hydrate(null)
  }
}

export const [getAuthContext, setAuthContext] = createContext<AuthStore>()

export function createAuthStore(initialUser?: Session | null): AuthStore {
  return new AuthStore(initialUser)
}
