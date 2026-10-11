import { client } from './generated/client.gen'
import type { GetAuthOauthData } from './generated/types.gen'

/** The backend owns OIDC provider selection and callback state. */
export function oauthLogin(): void {
  window.location.href = client.buildUrl<GetAuthOauthData>({
    url: '/api/v1/auth/oauth',
    query: { frontend_url: window.location.origin },
  })
}
