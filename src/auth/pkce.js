// PKCE (RFC 7636) + state helpers, using the Web Crypto API.

function base64UrlEncode(bytes) {
  let str = ''
  const arr = new Uint8Array(bytes)
  for (let i = 0; i < arr.byteLength; i++) str += String.fromCharCode(arr[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (let i = 0; i < length; i++) out += charset[values[i] % charset.length]
  return out
}

export function createVerifier() {
  // 43–128 chars per spec.
  return randomString(96)
}

export async function challengeFromVerifier(verifier) {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(digest)
}

export function createState() {
  return randomString(32)
}
