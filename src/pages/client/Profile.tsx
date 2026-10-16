import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeCheck,
  BookOpen,
  FileCheck2,
  ChevronRight,
  Clock,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import PageHeader from '../../components/PageHeader'
import { useAsync } from '../../hooks/useAsync'
import { formatINR, initials } from '../../utils/format'
import { kycBadge } from '../../utils/status'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: portfolio } = useAsync(() => api.client.getPortfolio())

  if (!user) return null

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="page">
      <PageHeader title="Profile" />

      <div className="profile-hero">
        <div className="profile-id">
          <div className="avatar avatar-lg">{initials(user.name)}</div>
          <div>
            <div className="profile-name">{user.name}</div>
            <div className="muted">{user.clientCode ?? user.email}</div>
          </div>
        </div>
        <div className="profile-margin">
          <span className="muted small">Margin available</span>
          <strong>{portfolio ? formatINR(portfolio.marginAvailable) : '—'}</strong>
        </div>
        <div className="profile-actions">
          <Link to="/client/deposit" className="btn btn-primary">
            <ArrowDownToLine size={18} /> Deposit
          </Link>
          <Link to="/client/withdraw" className="btn btn-danger-soft">
            <ArrowUpFromLine size={18} /> Withdraw
          </Link>
        </div>
      </div>

      <div className="menu-group">
        <div className="menu-group-title">Account</div>
        <MenuRow
          icon={<BadgeCheck size={18} />}
          label="Verification"
          value={
            user.verified ? (
              <span className="chip chip-up">Verified</span>
            ) : (
              <span className="chip chip-warn">Pending</span>
            )
          }
        />
        <MenuRow
          to="/client/kyc"
          icon={<FileCheck2 size={18} />}
          label="KYC details"
          value={<span className={`chip ${kycBadge(user.kycStatus).chip}`}>{kycBadge(user.kycStatus).label}</span>}
        />
        {user.clientCode && <MenuRow icon={<UserIcon size={18} />} label="User ID" value={user.clientCode} />}
        <MenuRow icon={<Mail size={18} />} label="Email" value={user.email} />
        {user.phone && <MenuRow icon={<Phone size={18} />} label="Phone" value={user.phone} />}
      </div>

      <div className="menu-group">
        <div className="menu-group-title">Settings</div>
        <MenuRow to="/client/ledger" icon={<BookOpen size={18} />} label="Ledger" />
        <MenuRow to="/client/withdraw" icon={<Clock size={18} />} label="Withdrawal history" />
        <MenuRow to="/client/change-password" icon={<KeyRound size={18} />} label="Change password" />
        <button className="menu-row danger" onClick={handleLogout}>
          <span className="menu-icon">
            <LogOut size={18} />
          </span>
          <span className="menu-label">Logout</span>
        </button>
      </div>
    </div>
  )
}

function MenuRow({ icon, label, value, to }: { icon: ReactNode; label: string; value?: ReactNode; to?: string }) {
  const content = (
    <>
      <span className="menu-icon">{icon}</span>
      <span className="menu-label">{label}</span>
      {value && <span className="menu-value">{value}</span>}
      {to && <ChevronRight size={18} className="muted" />}
    </>
  )
  return to ? (
    <Link to={to} className="menu-row">
      {content}
    </Link>
  ) : (
    <div className="menu-row">{content}</div>
  )
}
