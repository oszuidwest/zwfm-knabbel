import { api } from './client'
import { PUBLIC_API_URL } from '$env/static/public'
import type { User } from '$lib/types'

export interface AuthConfig {
  methods: Array<'local' | 'oidc'>
  oauth_url?: string
}

interface LoginResponse {
  message: string
}

export const authApi = {
  getConfig: () => api.get<AuthConfig>('/auth/config'),

  login: (username: string, password: string) =>
    api.post<LoginResponse>('/sessions', { username, password }),

  logout: () => api.delete<{ message: string }>('/sessions/current'),

  getMe: () => api.get<User>('/sessions/current'),

  /**
   * Initiate OIDC login by redirecting to the OAuth endpoint
   * The backend will redirect to the OIDC provider
   */
  oauthLogin: (): void => {
    const frontendUrl = window.location.origin
    const oauthUrl = `${PUBLIC_API_URL}/api/v1/auth/oauth?frontend_url=${encodeURIComponent(frontendUrl)}`
    window.location.href = oauthUrl
  },

  /**
   * Complete OIDC login by exchanging code for session
   */
  oauthCallback: (code: string, state: string) =>
    api.get<LoginResponse>('/auth/oauth/callback', { code, state }),
}
