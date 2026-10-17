import { ChartCandlestick, ExternalLink, Landmark, LogOut, Menu, MessagesSquare, Receipt, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'
import Logo from '../components/Logo'
import { useSupportUnread } from '../hooks/useSupportUnread'
import { initials } from '../utils/format'
import '../styles/admin.css'

const NAV = [
  { to: '/admin', label: 'Clients', icon: Users, end: false },
  { to: '/admin/market', label: 'Market Watch', icon: ChartCandlestick, end: true },
  { to: '/admin/payment', label: 'Deposit Details', icon: Landmark, end: true },
  { to: '/admin/payment-proofs', label: 'Payment Proofs', icon: Receipt, end: true },
  { to: '/admin/support', label: 'Support', icon: MessagesSquare, end: false },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const supportUnread = useSupportUnread(api.admin.getSupportUnread)

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  // "Clients" stays active on /admin/users/... but not on /admin/market or /admin/payment
  const isClientsActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/users')

  return (
    <div className="admin-app">
      <aside className={`a-sidebar ${open ? 'open' : ''}`}>
        <div className="a-sidebar-head">
          <Link to="/admin">
            <Logo size={30} />
          </Link>
          <span className="badge">Admin</span>
          <button className="icon-btn a-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="a-nav">
          <span className="a-nav-label">Manage</span>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => ((to === '/admin' ? isClientsActive : isActive) ? 'active' : '')}
            >
              <Icon size={18} /> {label}
              {to === '/admin/support' && supportUnread > 0 && <span className="notif-pill a-nav-badge">{supportUnread > 99 ? '99+' : supportUnread}</span>}
            </NavLink>
          ))}
          <span className="a-nav-label">Site</span>
          <Link to="/" target="_blank" rel="noreferrer">
            <ExternalLink size={18} /> View homepage
          </Link>
        </nav>

        <div className="a-sidebar-foot">
          <div className="avatar avatar-sm">{initials(user?.name ?? 'A')}</div>
          <div className="a-user">
            <strong>{user?.name}</strong>
            <span className="muted small">{user?.email}</span>
          </div>
          <button className="icon-btn" onClick={handleLogout} aria-label="Logout" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className={`a-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <div className="a-body">
        <header className="a-topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <Logo size={28} />
          <span className="badge">Admin</span>
          <Link to="/admin/support" className="icon-btn notif-btn a-topbar-support" aria-label={supportUnread ? `Support, ${supportUnread} unread` : 'Support'}>
            <MessagesSquare size={20} />
            {supportUnread > 0 && <span className="notif-badge">{supportUnread > 9 ? '9+' : supportUnread}</span>}
          </Link>
        </header>
        <main className="a-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
