import { ArrowRight, Briefcase, ChartCandlestick, ChartLine, Headset, ShieldAlert, User } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useOutletContext } from 'react-router'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'
import { useSupportUnread } from '../hooks/useSupportUnread'
import { initials } from '../utils/format'
import '../styles/client.css'

export interface ClientShellCtx {
  /** Unread replies from support, for badges on child pages. */
  supportUnread: number
}

// eslint-disable-next-line react-refresh/only-export-components
export const useClientShell = () => useOutletContext<ClientShellCtx>()

const NAV = [
  { to: '/client', label: 'Watchlist', icon: ChartCandlestick, end: true },
  { to: '/client/trades', label: 'Trades', icon: ChartLine },
  { to: '/client/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/client/profile', label: 'Profile', icon: User },
]

export default function ClientLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  // Nudge until KYC is submitted (or after it's rejected); hidden on the KYC page itself.
  const kycNudge = user && (!user.kycStatus || user.kycStatus === 'REJECTED') && pathname !== '/client/kyc'
  const supportUnread = useSupportUnread(api.client.getSupportUnread)

  return (
    <div className="client-app">
      <header className="c-topbar">
        <div className="c-container c-topbar-inner">
          <Link to="/client" aria-label="Watchlist">
            <Logo size={30} />
          </Link>
          <nav className="c-topnav">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="c-topbar-actions">
            <Link
              to="/client/support"
              className={`icon-btn notif-btn ${pathname === '/client/support' ? 'active' : ''}`}
              aria-label={supportUnread ? `Support, ${supportUnread} unread` : 'Support'}
              title="Help & support"
            >
              <Headset size={20} />
              {supportUnread > 0 && <span className="notif-badge">{supportUnread > 9 ? '9+' : supportUnread}</span>}
            </Link>
            <Link to="/client/profile" className="avatar avatar-sm" aria-label="Profile">
              {initials(user?.name ?? '')}
            </Link>
          </div>
        </div>
      </header>

      <main className="c-container c-main">
        {kycNudge && (
          <Link to="/client/kyc" className="kyc-banner">
            <span className="kyc-banner-icon">
              <ShieldAlert size={20} />
            </span>
            <span className="kyc-banner-text">
              <strong>{user.kycStatus === 'REJECTED' ? 'Your KYC needs changes' : 'Complete your KYC'}</strong>
              <span>
                {user.kycStatus === 'REJECTED'
                  ? 'We couldn’t verify your details. Tap to review and resubmit.'
                  : 'Verify your identity in 2 minutes to get your account fully activated.'}
              </span>
            </span>
            <ArrowRight size={18} className="kyc-banner-arrow" />
          </Link>
        )}
        <Outlet context={{ supportUnread } satisfies ClientShellCtx} />
      </main>

      <nav className="c-bottomnav" aria-label="Primary">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
