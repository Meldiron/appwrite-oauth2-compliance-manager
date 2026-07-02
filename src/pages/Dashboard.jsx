import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, getStoredUser } from '../auth/oauth'
import { fetchAllOrganizations, fetchAllMemberships, summarizeMemberships } from '../api/appwrite'
import { generateComplianceReport } from '../pdf/report'
import { TopBar, Footer, DocIcon, CheckIcon } from '../components/ui'

function meterClass(pct) {
  if (pct >= 80) return ''
  if (pct >= 50) return 'meter__fill--mid'
  return 'meter__fill--low'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const ran = useRef(false)

  const [status, setStatus] = useState('loading') // loading | ready | error
  const [progress, setProgress] = useState({ label: 'Contacting Appwrite…', pct: 5 })
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      navigate('/', { replace: true })
      return
    }
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        setProgress({ label: 'Loading organizations…', pct: 10 })
        const { total: orgTotal, organizations } = await fetchAllOrganizations()

        const enriched = []
        let totalMembers = 0

        for (let i = 0; i < organizations.length; i++) {
          const org = organizations[i]
          const name = org.name || org.$id
          const base = 15 + Math.round((i / Math.max(organizations.length, 1)) * 80)
          setProgress({
            label: `Auditing ${name} (${i + 1}/${organizations.length})…`,
            pct: base,
          })

          const { memberships } = await fetchAllMemberships(org.$id)
          const summary = summarizeMemberships(memberships)
          totalMembers += summary.total
          enriched.push({ id: org.$id, name, summary })
        }

        setData({
          orgTotal: orgTotal || organizations.length,
          totalMembers,
          totalNonCompliant: enriched.reduce((s, o) => s + o.summary.nonCompliantCount, 0),
          organizations: enriched,
        })
        setProgress({ label: 'Complete', pct: 100 })
        setStatus('ready')
      } catch (e) {
        setError(e.message)
        setStatus('error')
      }
    })()
  }, [navigate])

  function handleExport() {
    if (!data) return
    setExporting(true)
    try {
      generateComplianceReport({
        user,
        organizations: data.organizations,
      })
    } catch (e) {
      alert(`Failed to generate report: ${e.message}`)
    } finally {
      setExporting(false)
    }
  }

  // -------------------------------------------------------------- Loading state
  if (status === 'loading') {
    return (
      <div className="app">
        <TopBar user={user} />
        <main className="center-state">
          <div className="container">
            <div className="panel">
              <div className="spinner" />
              <h2>Assembling compliance data</h2>
              <p>Auditing MFA posture across your organizations.</p>
              <div className="progress">
                {progress.label}
                <div className="progress__bar">
                  <i style={{ width: `${progress.pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ---------------------------------------------------------------- Error state
  if (status === 'error') {
    return (
      <div className="app">
        <TopBar user={user} />
        <main className="center-state">
          <div className="container">
            <div className="panel">
              <h2>Unable to load data</h2>
              <p>The compliance audit could not be completed.</p>
              <div className="error-box">{error}</div>
              <button className="btn btn--gold" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // ---------------------------------------------------------------- Ready state
  const overallPct =
    data.totalMembers === 0
      ? 100
      : Math.round(((data.totalMembers - data.totalNonCompliant) / data.totalMembers) * 100)

  return (
    <div className="app">
      <TopBar user={user} />
      <main className="page">
        <div className="container">
          <div className="page__head">
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Compliance Overview
              </div>
              <h1 className="page__title">Security posture at a glance</h1>
              <p className="page__subtitle">
                A live audit of multi-factor authentication across every organization you
                administer. Export the full report for your records.
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="stats">
            <div className="stat">
              <div className="stat__label">Organizations selected</div>
              <div className="stat__value">{data.orgTotal}</div>
              <div className="stat__meta">Under compliance review</div>
            </div>
            <div className="stat">
              <div className="stat__label">Total members</div>
              <div className="stat__value">{data.totalMembers}</div>
              <div className="stat__meta">Across all organizations</div>
            </div>
            <div className="stat stat--accent">
              <div className="stat__label">Overall MFA coverage</div>
              <div className="stat__value">{overallPct}%</div>
              <div className="stat__meta">
                {data.totalNonCompliant} member{data.totalNonCompliant === 1 ? '' : 's'} without MFA
              </div>
            </div>
          </div>

          {/* Export CTA */}
          <div className="export">
            <div className="export__copy">
              <h2>Generate compliance report</h2>
              <p>
                A detailed, auditor-ready PDF: per-organization compliance rates and a full
                register of every member missing multi-factor authentication.
              </p>
            </div>
            <button className="btn btn--gold btn--lg" onClick={handleExport} disabled={exporting}>
              {exporting ? <span className="spinner spinner--sm" /> : <DocIcon className="btn__icon" />}
              {exporting ? 'Preparing…' : 'Export PDF report'}
            </button>
          </div>

          {/* Org roster */}
          <div className="section-label">
            <span className="eyebrow">Organizations</span>
            <span className="section-label__line" />
          </div>

          <div className="roster">
            {data.organizations.map((org) => {
              const s = org.summary
              const compliant = s.nonCompliantCount === 0
              return (
                <div className="org" key={org.id}>
                  <div>
                    <div className="org__name">{org.name}</div>
                    <div className="org__id">{org.id}</div>
                  </div>
                  <div className="org__right">
                    <div className="org__figure">
                      <b>{s.total}</b>
                      <span>Members</span>
                    </div>
                    <div className="meter">
                      <div className="meter__track">
                        <div
                          className={`meter__fill ${meterClass(s.percentage)}`}
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                      <div className="meter__caption">
                        <span>{s.percentage}% MFA</span>
                        <span>{s.nonCompliantCount} gap{s.nonCompliantCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                    <span className={`badge ${compliant ? 'badge--ok' : 'badge--danger'}`}>
                      {compliant ? <CheckIcon style={{ width: 12, height: 12 }} /> : <span className="badge__dot" />}
                      {compliant ? 'Compliant' : 'Action needed'}
                    </span>
                  </div>
                </div>
              )
            })}
            {data.organizations.length === 0 && (
              <div className="panel" style={{ margin: '0 auto' }}>
                <p>No organizations are associated with this account.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
