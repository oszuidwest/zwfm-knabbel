import { createContext } from 'svelte'
import { authApi } from '$lib/api/auth'
import type { User } from '$lib/types'

interface CheckAuthOptions {
  force?: boolean
}

export class AuthStore {
  user = $state<User | null>(null)
  loading = $state(true)
  checked = $state(false)

  isAdmin = $derived(this.user?.role === 'admin')
  canViewPronunciations = $derived(!!this.user)
  canEditPronunciations = $derived(this.user?.role === 'admin' || this.user?.role === 'editor')
  canViewTtsSettings = $derived(!!this.user)
  canEditTtsSettings = $derived(this.user?.role === 'admin')

  private checkPromise: Promise<boolean> | null = null

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
      const user = await authApi.getMe()
      this.user = user
      return true
    } catch {
      this.user = null
      return false
    } finally {
      this.loading = false
      this.checked = true
    }
  }

  async login(username: string, password: string): Promise<void> {
    await authApi.login(username, password)
    await this.checkAuth()
  }

  async logout(): Promise<void> {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    }
    this.user = null
    this.loading = false
    this.checked = true
  }
}

export const [getAuthContext, setAuthContext] = createContext<AuthStore>()

export function createAuthStore(): AuthStore {
  return new AuthStore()
}
