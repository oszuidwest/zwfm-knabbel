import { api, type FetchFn } from './client'
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

  getMe: (customFetch?: FetchFn) => api.get<User>('/sessions/current', undefined, customFetch),

  /**
   * oauthLogin starts OIDC by redirecting through the API.
   * The backend owns provider selection and callback state.
   */
  oauthLogin: (): void => {
    const frontendUrl = window.location.origin
    const oauthUrl = `${PUBLIC_API_URL}/api/v1/auth/oauth?frontend_url=${encodeURIComponent(frontendUrl)}`
    window.location.href = oauthUrl
  },

  /** oauthCallback completes OIDC by exchanging the provider code for a session. */
  oauthCallback: (code: string, state: string) =>
    api.get<LoginResponse>('/auth/oauth/callback', { code, state }),
}
