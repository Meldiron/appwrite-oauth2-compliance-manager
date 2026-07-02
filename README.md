# Sentinel — Compliance Manager

Enterprise OAuth2 compliance dashboard. Signs in with Appwrite (public client,
Authorization Code + PKCE), audits multi-factor-authentication posture across
every organization you administer, and exports an auditor-ready PDF report.

## Run

```bash
npm install
npm run dev      # serves on http://localhost:3000 (must match the registered redirect URL)
```

Open http://localhost:3000 and click **Sign in with Appwrite**.

## How it works

1. **Home** (`/`) — single gold "Sign in with Appwrite" CTA. Generates a PKCE
   verifier + `state`, stores them in `sessionStorage`, and redirects to the
   Appwrite authorization endpoint requesting scope `organization:organization.read`.
2. **Redirect** (`/redirect`) — exchanges the `code` for an access token at the
   token endpoint (public client, no secret), then loads userinfo.
3. **Dashboard** (`/dashboard`) — shows:
   - number of organizations (from `GET /oauth2/console/organizations`, offset-paginated),
   - total members (sum of `total` from `GET /teams/{id}/memberships` per org),
   - **Export PDF report** CTA — per-org compliant / non-compliant counts and
     percentage, plus a full register of every member without MFA
     (`mfa === false`), name / email / phone.

Membership listing uses Appwrite query-based offset pagination
(`queries[n]={"method":"limit"|"offset"|"orderAsc",...}`).

## Configuration

All OAuth/API config lives in `src/auth/config.js`:

- `clientId`: `complience-mamager`
- `redirectUri`: `http://localhost:3000/redirect`
- base: `https://fra.cloud.appwrite.io/v1`

### Note on the project header

Appwrite `/teams/*` calls are sent with `X-Appwrite-Project: console` (see
`src/api/appwrite.js`). If your tenant scopes these differently, adjust
`CONSOLE_PROJECT` in `config.js`.

## Design

Institutional / bank-vault identity: deep midnight-navy canvas, steel surfaces,
a restrained brushed-gold accent, hairline borders, small radii. Fraunces
(serif) for authority, Inter for UI, JetBrains Mono for data.
