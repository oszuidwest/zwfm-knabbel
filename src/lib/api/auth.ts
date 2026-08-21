import { client } from './generated/client.gen'
import type { GetAuthOauthData } from './generated/types.gen'

/**
 * oauthLogin starts OIDC by redirecting through the API.
 * The backend owns provider selection and callback state.
 */
export function oauthLogin(): void {
  window.location.href = client.buildUrl<GetAuthOauthData>({
    url: '/api/v1/auth/oauth',
    query: { frontend_url: window.location.origin },
  })
}
