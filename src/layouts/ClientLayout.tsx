import { Briefcase, ChartCandlestick, ChartLine, User } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'
import { initials } from '../utils/format'
import '../styles/client.css'

const NAV = [
  { to: '/client', label: 'Watchlist', icon: ChartCandlestick, end: true },
  { to: '/client/trades', label: 'Trades', icon: ChartLine },
  { to: '/client/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/client/profile', label: 'Profile', icon: User },
]

export default function ClientLayout() {
  const { user } = useAuth()

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
          <Link to="/client/profile" className="avatar avatar-sm" aria-label="Profile">
            {initials(user?.name ?? '')}
          </Link>
        </div>
      </header>

      <main className="c-container c-main">
        <Outlet />
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
