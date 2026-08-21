import { createContext } from 'svelte'
import { ApiError } from '$lib/api/client'
import { deleteSessionsCurrent, getSessionsCurrent, postSessions } from '$lib/api/generated/sdk.gen'
import { can as sessionCan, type Action, type Resource } from '$lib/auth/policy'
import type { Session } from '$lib/types'

interface CheckAuthOptions {
  force?: boolean
}

export class AuthStore {
  user = $state<Session | null>(null)
  loading = $state(true)
  checked = $state(false)

  private checkPromise: Promise<boolean> | null = null

  constructor(initialUser?: Session | null) {
    if (initialUser !== undefined) {
      this.hydrate(initialUser)
    }
  }

  hydrate(user: Session | null): void {
    this.user = user
    this.loading = false
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
    this.loading = true

    try {
      const user = await getSessionsCurrent()
      this.user = user
      return true
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        console.error('[auth] checkAuth failed', err)
      }
      this.user = null
      return false
    } finally {
      this.loading = false
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
    this.user = null
    this.loading = false
    this.checked = true
  }
}

export const [getAuthContext, setAuthContext] = createContext<AuthStore>()

export function createAuthStore(initialUser?: Session | null): AuthStore {
  return new AuthStore(initialUser)
}
