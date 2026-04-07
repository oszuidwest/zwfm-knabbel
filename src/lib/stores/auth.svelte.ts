import { authApi } from '$lib/api/auth'
import type { User } from '$lib/types'

class AuthStore {
  user = $state<User | null>(null)
  loading = $state(true)
  checked = $state(false)

  isAdmin = $derived(this.user?.role === 'admin')

  private checkInProgress = false

  async checkAuth(): Promise<boolean> {
    // Prevent concurrent auth checks
    if (this.checkInProgress) {
      return !!this.user
    }

    this.checkInProgress = true
    this.loading = true

    try {
      const user = await authApi.getMe()
      this.user = user
      return true
    } catch {
      this.user = null
      return false
    } finally {
      // Always reset loading state, even on weird network errors
      this.loading = false
      this.checked = true
      this.checkInProgress = false
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

export const auth = new AuthStore()
