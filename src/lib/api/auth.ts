import { PUBLIC_API_URL } from '$env/static/public'
import { apiCall, type FetchFn } from './client'
import {
  deleteSessionsCurrent,
  getAuthConfig,
  getAuthOauthCallback,
  getSessionsCurrent,
  postSessions,
} from './generated/sdk.gen'
import type { GetAuthConfigResponse } from './generated/types.gen'

export type AuthConfig = GetAuthConfigResponse

export const authApi = {
  getConfig: () => apiCall(signal => getAuthConfig({ signal })),

  login: (username: string, password: string) =>
    apiCall(signal => postSessions({ body: { username, password }, signal })),

  logout: () => apiCall(signal => deleteSessionsCurrent({ signal })),

  getMe: (customFetch?: FetchFn) =>
    apiCall(signal => getSessionsCurrent({ fetch: customFetch, signal })),

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
    apiCall(signal => getAuthOauthCallback({ query: { code, state }, signal })),
}
