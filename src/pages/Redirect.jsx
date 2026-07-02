import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCode, fetchUserInfo } from '../auth/oauth'
import { TopBar, Footer } from '../components/ui'

export default function Redirect() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const ran = useRef(false)

  useEffect(() => {
    // Guard against React 18/19 StrictMode double-invocation — code is single-use.
    if (ran.current) return
    ran.current = true

    const errParam = params.get('error')
    if (errParam) {
      setError(params.get('error_description') || errParam)
      return
    }

    const code = params.get('code')
    const state = params.get('state')
    if (!code) {
      setError('No authorization code returned by the provider.')
      return
    }

    ;(async () => {
      try {
        const token = await exchangeCode({ code, state })
        await fetchUserInfo(token)
        navigate('/dashboard', { replace: true })
      } catch (e) {
        setError(e.message)
      }
    })()
  }, [params, navigate])

  return (
    <div className="app">
      <TopBar />
      <main className="center-state">
        <div className="container">
          <div className="panel">
            {error ? (
              <>
                <h2>Sign-in could not complete</h2>
                <p>We were unable to finalize your secure session.</p>
                <div className="error-box">{error}</div>
                <button className="btn btn--gold" onClick={() => navigate('/', { replace: true })}>
                  Return to sign-in
                </button>
              </>
            ) : (
              <>
                <div className="spinner" />
                <h2>Establishing secure session</h2>
                <p>Verifying your authorization with Appwrite…</p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
