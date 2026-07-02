import { APPWRITE_BASE, CONSOLE_PROJECT } from '../auth/config'
import { getToken } from '../auth/oauth'

const PAGE_SIZE = 100

function authHeaders() {
  const token = getToken()
  return {
    Authorization: `Bearer ${token}`,
    'X-Appwrite-Project': CONSOLE_PROJECT,
    'Content-Type': 'application/json',
  }
}

async function apiGet(path, search, extraHeaders) {
  const url = `${APPWRITE_BASE}${path}${search ? `?${search}` : ''}`
  const res = await fetch(url, { headers: { ...authHeaders(), ...extraHeaders } })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.message || detail
    } catch {
      /* ignore */
    }
    throw new Error(`${path} — ${detail}`)
  }
  return res.json()
}

// ---- Organizations (console endpoint, simple limit/offset pagination) -------

export async function fetchAllOrganizations() {
  const organizations = []
  let offset = 0
  let total = 0

  do {
    const search = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    }).toString()
    const page = await apiGet('/oauth2/console/organizations', search)
    total = page.total ?? 0
    const batch = page.organizations || []
    organizations.push(...batch)
    offset += batch.length
    if (batch.length === 0) break
  } while (organizations.length < total)

  return { total, organizations }
}

// ---- Team memberships (Appwrite query-based offset pagination) --------------

function membershipQueries(limit, offset) {
  // Appwrite expects each query as a JSON-encoded object in queries[n].
  const queries = [
    { method: 'orderAsc', attribute: '$createdAt' },
    { method: 'limit', values: [limit] },
    { method: 'offset', values: [offset] },
  ]
  const params = new URLSearchParams()
  queries.forEach((q, i) => params.append(`queries[${i}]`, JSON.stringify(q)))
  return params.toString()
}

// Fetch a single page of memberships for a team/organization.
export async function fetchMembershipsPage(teamId, offset) {
  return apiGet('/organization/memberships', membershipQueries(PAGE_SIZE, offset), {
    'X-Appwrite-Organization': teamId,
  })
}

// Fetch every membership for a team, paginating with offset until exhausted.
export async function fetchAllMemberships(teamId, onProgress) {
  const memberships = []
  let offset = 0
  let total = 0

  do {
    const page = await fetchMembershipsPage(teamId, offset)
    total = page.total ?? 0
    const batch = page.memberships || []
    memberships.push(...batch)
    offset += batch.length
    if (onProgress) onProgress(memberships.length, total)
    if (batch.length === 0) break
  } while (memberships.length < total)

  return { total, memberships }
}

// A member is non-compliant if MFA is disabled.
export function isNonCompliant(membership) {
  return membership?.mfa === false
}

// Build a per-organization compliance report by walking all memberships.
export function summarizeMemberships(memberships) {
  const nonCompliant = []
  let compliant = 0

  for (const m of memberships) {
    if (isNonCompliant(m)) {
      nonCompliant.push({
        name: m.userName || '—',
        email: m.userEmail || '—',
        phone: m.userPhone || '—',
      })
    } else {
      compliant++
    }
  }

  const total = memberships.length
  const percentage = total === 0 ? 100 : Math.round((compliant / total) * 100)

  return {
    total,
    compliant,
    nonCompliantCount: nonCompliant.length,
    nonCompliant,
    percentage,
  }
}
