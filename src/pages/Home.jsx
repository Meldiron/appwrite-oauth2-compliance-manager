import { useState } from 'react'
import { beginLogin } from '../auth/oauth'
import { TopBar, Footer, ShieldMark, CheckIcon, AppwriteIcon } from '../components/ui'

export default function Home() {
  const [busy, setBusy] = useState(false)

  async function handleLogin() {
    setBusy(true)
    try {
      await beginLogin()
    } catch (e) {
      setBusy(false)
      alert(`Could not start sign-in: ${e.message}`)
    }
  }

  return (
    <div className="app">
      <TopBar centered />
      <main className="hero">
        <div className="container">
          <div className="hero__card">
            <ShieldMark className="hero__seal" />
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Enterprise Compliance Oversight
            </div>
            <h1>Verify your organization&rsquo;s security posture.</h1>
            <p className="hero__lead">
              Sentinel audits multi-factor authentication across every organization you
              administer and produces an auditor-ready compliance report in seconds.
            </p>

            <button className="btn btn--gold btn--lg" onClick={handleLogin} disabled={busy}>
              {busy ? (
                <span className="spinner spinner--sm" />
              ) : (
                <AppwriteIcon className="btn__icon btn__icon--brand" />
              )}
              {busy ? 'Redirecting…' : 'Sign in with Appwrite'}
            </button>

            <div className="hero__divider">Bank-grade authentication</div>

            <div className="hero__assurances">
              <span>
                <CheckIcon /> No password stored
              </span>
              <span>
                <ShieldMark style={{ width: 14, height: 14 }} /> Scoped access
              </span>
            </div>

            <p className="hero__foot">
              You will be redirected to Appwrite to authorize read-only access to your
              organization directory.
            </p>
          </div>
        </div>
      </main>
      <Footer centered />
    </div>
  )
}
