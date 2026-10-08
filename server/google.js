// "Sign in with Google" using the OpenID Connect authorization-code flow. The ID token comes
// straight from Google's token endpoint over TLS, in exchange for our client secret, so its
// claims can be trusted without checking the signature (OpenID Connect Core 3.1.3.7).

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ISSUERS = ['accounts.google.com', 'https://accounts.google.com']

export function googleAuthUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' })
  return `${AUTH_URL}?${params}`
}

// Trades the code Google sent back for the signed-in person's ID token claims.
export async function exchangeGoogleCode({ clientId, clientSecret, redirectUri, code }) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.id_token) throw new Error(`Google token exchange failed: ${data.error || response.status}`)
  return JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64url').toString())
}

// The Google account behind the claims, or null if they aren't for us or the email isn't verified.
export function googleAccount(claims, clientId) {
  const fresh = Number(claims.exp) * 1000 > Date.now()
  if (claims.aud !== clientId || !ISSUERS.includes(claims.iss) || !fresh || !claims.sub) return null
  if (claims.email_verified !== true || typeof claims.email !== 'string') return null
  return { googleId: String(claims.sub), email: claims.email.trim().toLowerCase() }
}
