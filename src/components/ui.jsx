import { useNavigate } from 'react-router-dom'
import { logout, getToken } from '../auth/oauth'

export function ShieldMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ddc37e" />
          <stop offset="1" stopColor="#c8a95a" />
        </linearGradient>
      </defs>
      <path
        d="M24 4l14 5v11c0 9.3-6 17.3-14 20-8-2.7-14-10.7-14-20V9l14-5z"
        fill="rgba(200,169,90,0.08)"
        stroke="url(#sg)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M17 24l5 5 9.5-10"
        fill="none"
        stroke="url(#sg)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TopBar({ user, centered }) {
  const navigate = useNavigate()
  return (
    <header className="topbar">
      <div className={`container topbar__inner${centered ? ' topbar__inner--centered' : ''}`}>
        <div className="brand">
          <ShieldMark className="brand__mark" />
          <div>
            <div className="brand__name">Sentinel</div>
            <div className="brand__sub">Compliance Manager</div>
          </div>
        </div>
        {(user || getToken()) && (
          <div className="topbar__meta">
            {user && (
              <div className="topbar__user">
                <b>{user.name || 'Signed in'}</b>
                <span>{user.email}</span>
              </div>
            )}
            <button
              className="btn btn--ghost"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export function Footer({ centered }) {
  return (
    <footer className="footer">
      <div className={`container footer__inner${centered ? ' footer__inner--centered' : ''}`}>
        <span>© {new Date().getFullYear()} Sentinel — Compliance Manager. Confidential.</span>
        <span className="mono">Secured via HTTPS and S256</span>
      </div>
    </footer>
  )
}

export function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10" width="16" height="10" rx="2" strokeLinejoin="round" />
      <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DocIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Official Appwrite logomark — https://appwrite.io/assets/logomark/logo.svg
export function AppwriteIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 112 98" fill="currentColor" aria-hidden="true">
      <path
        d="M111.1 73.4729V97.9638H48.8706C30.7406 97.9638 14.9105 88.114 6.44112 73.4729C5.2099 71.3444 4.13229 69.1113 3.22835 66.7935C1.45387 62.2516 0.338421 57.3779 0 52.2926V45.6712C0.0734729 44.5379 0.189248 43.4135 0.340647 42.3025C0.650124 40.0227 1.11768 37.7918 1.73218 35.6232C7.54544 15.0641 26.448 0 48.8706 0C71.2932 0 90.1935 15.0641 96.0068 35.6232H69.3985C65.0302 28.9216 57.4692 24.491 48.8706 24.491C40.272 24.491 32.711 28.9216 28.3427 35.6232C27.0113 37.6604 25.9782 39.9069 25.3014 42.3025C24.7002 44.4266 24.3796 46.6664 24.3796 48.9819C24.3796 56.0019 27.3319 62.3295 32.0653 66.7935C36.4515 70.9369 42.3649 73.4729 48.8706 73.4729H111.1Z"
      />
      <path
        d="M111.1 42.3027V66.7937H65.6759C70.4094 62.3297 73.3616 56.0021 73.3616 48.9821C73.3616 46.6666 73.041 44.4268 72.4399 42.3027H111.1Z"
      />
    </svg>
  )
}
