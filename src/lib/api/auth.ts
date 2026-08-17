import { PUBLIC_API_URL } from '$env/static/public'

/**
 * oauthLogin starts OIDC by redirecting through the API.
 * The backend owns provider selection and callback state.
 */
export function oauthLogin(): void {
  const frontendUrl = window.location.origin
  window.location.href = `${PUBLIC_API_URL}/api/v1/auth/oauth?frontend_url=${encodeURIComponent(frontendUrl)}`
}
