// OAuth2 / Appwrite configuration.
// Public client (PKCE, no secret) against the Appwrite Console OAuth2 server.

export const APPWRITE_BASE = 'https://fra.cloud.appwrite.io/v1'

export const OAUTH = {
  authorizationEndpoint: `${APPWRITE_BASE}/oauth2/console/authorize`,
  tokenEndpoint: `${APPWRITE_BASE}/oauth2/console/token`,
  userinfoEndpoint: `${APPWRITE_BASE}/oauth2/console/userinfo`,
  endSessionEndpoint: `${APPWRITE_BASE}/oauth2/console/logout`,

  clientId: 'complience-mamager',
  redirectUri: `${window.location.origin}/redirect`,
  scope: 'organization:organization.memberships.read',
}

// Appwrite Console requests are scoped to the "console" project.
export const CONSOLE_PROJECT = 'console'

// sessionStorage keys
export const STORAGE = {
  verifier: 'sentinel.pkce_verifier',
  state: 'sentinel.oauth_state',
  token: 'sentinel.access_token',
  user: 'sentinel.userinfo',
}
