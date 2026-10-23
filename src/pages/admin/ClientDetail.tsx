import { ArrowUpFromLine, BookOpen, Briefcase, ChartLine, ChevronLeft, FileCheck2, MessagesSquare, Receipt, User as UserIcon, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router'
import { api } from '../../api'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { User } from '../../types'
import { errorMessage, initials } from '../../utils/format'
import { kycBadge } from '../../utils/status'

export interface ClientCtx {
  user: User
  setUser: (u: User) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const useClient = () => useOutletContext<ClientCtx>()

const TABS = [
  { to: '', label: 'Profile', icon: UserIcon, end: true },
  { to: 'kyc', label: 'KYC', icon: FileCheck2 },
  { to: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { to: 'trades', label: 'Trades', icon: ChartLine },
  { to: 'ledger', label: 'Ledger', icon: BookOpen },
  { to: 'deposits', label: 'Deposits', icon: Receipt },
  { to: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
]

/** Wrapper for one client's admin pages; child tabs get the client via outlet context. */
export default function ClientDetail() {
  const { userId = '' } = useParams()
  const { data: user, setData, error, loading, reload } = useAsync(() => api.admin.getUser(userId), [userId])
  const [toggling, setToggling] = useState(false)

  async function toggleDisabled(u: User) {
    const disable = !u.disabled
    const warning = disable
      ? `Disable ${u.name}? They will be logged out and won't be able to log in, and their email / phone can't be used to sign up again.`
      : `Re-enable ${u.name}? They will be able to log in again.`
    if (!window.confirm(warning)) return
    setToggling(true)
    try {
      setData(await api.admin.setUserDisabled(u.id, disable))
    } catch (err) {
      window.alert(errorMessage(err, 'Could not update the account'))
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <Loading rows={3} />
  if (error || !user) return <ErrorBox message={error ?? 'Client not found'} onRetry={reload} />

  return (
    <div className="page">
      <Link to="/admin" className="back-link">
        <ChevronLeft size={16} /> All clients
      </Link>

      <div className="client-header">
        <div className="avatar avatar-lg">{initials(user.name)}</div>
        <div className="client-header-info">
          <h1>{user.name}</h1>
          <div className="muted">
            {user.clientCode && <span className="mono">{user.clientCode} · </span>}
            {user.email}
            {user.phone && ` · ${user.phone}`}
          </div>
        </div>
        <div className="row-gap">
          <span className={`chip ${kycBadge(user.kycStatus).chip}`}>{kycBadge(user.kycStatus).label}</span>
          {user.disabled && <span className="chip chip-down">Disabled</span>}
          <span className={`chip ${user.verified ? 'chip-up' : 'chip-warn'}`}>{user.verified ? 'Verified' : 'Pending verification'}</span>
          <Link to={`/admin/support/${user.id}`} className="btn btn-ghost btn-sm">
            <MessagesSquare size={16} /> Message
          </Link>
          <button className={`btn btn-sm ${user.disabled ? 'btn-success' : 'btn-danger-soft'}`} onClick={() => toggleDisabled(user)} disabled={toggling}>
            {user.disabled ? <UserCheck size={16} /> : <UserX size={16} />} {user.disabled ? 'Enable account' : 'Disable account'}
          </button>
        </div>
      </div>

      <nav className="tabs" aria-label="Client sections">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={label} to={to} end={end}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ user, setUser: setData } satisfies ClientCtx} />
    </div>
  )
}
