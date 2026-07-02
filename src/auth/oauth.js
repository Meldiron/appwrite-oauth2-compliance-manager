import { OAUTH, STORAGE } from './config'
import { createVerifier, challengeFromVerifier, createState } from './pkce'

// Kick off the Authorization Code + PKCE flow by redirecting the browser
// to the Appwrite OAuth2 authorization endpoint.
export async function beginLogin() {
  const verifier = createVerifier()
  const state = createState()
  const challenge = await challengeFromVerifier(verifier)

  sessionStorage.setItem(STORAGE.verifier, verifier)
  sessionStorage.setItem(STORAGE.state, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH.clientId,
    redirect_uri: OAUTH.redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  // Only request a scope when one is configured (temporarily disabled).
  if (OAUTH.scope) params.set('scope', OAUTH.scope)

  window.location.assign(`${OAUTH.authorizationEndpoint}?${params.toString()}`)
}

// Exchange the authorization code for an access token (public client -> no secret).
export async function exchangeCode({ code, state }) {
  const storedState = sessionStorage.getItem(STORAGE.state)
  const verifier = sessionStorage.getItem(STORAGE.verifier)

  if (!verifier) {
    throw new Error('Missing PKCE verifier. Please restart the sign-in process.')
  }
  if (!state || state !== storedState) {
    throw new Error('State mismatch — possible CSRF. Sign-in aborted.')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: OAUTH.redirectUri,
    client_id: OAUTH.clientId,
    code_verifier: verifier,
  })

  const res = await fetch(OAUTH.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    const detail = data.error_description || data.error || data.message || `HTTP ${res.status}`
    throw new Error(`Token exchange failed: ${detail}`)
  }

  // One-time material — clear it immediately.
  sessionStorage.removeItem(STORAGE.verifier)
  sessionStorage.removeItem(STORAGE.state)
  sessionStorage.setItem(STORAGE.token, data.access_token)

  return data.access_token
}

export async function fetchUserInfo(token) {
  try {
    const res = await fetch(OAUTH.userinfoEndpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const info = await res.json()
    sessionStorage.setItem(STORAGE.user, JSON.stringify(info))
    return info
  } catch {
    return null
  }
}

export function getToken() {
  return sessionStorage.getItem(STORAGE.token)
}

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE.user) || 'null')
  } catch {
    return null
  }
}

export function logout() {
  sessionStorage.removeItem(STORAGE.token)
  sessionStorage.removeItem(STORAGE.user)
  sessionStorage.removeItem(STORAGE.verifier)
  sessionStorage.removeItem(STORAGE.state)
}
