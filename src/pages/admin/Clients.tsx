import { BadgeCheck, ChevronRight, Clock, Plus, Search, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../../api'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { NewClientInput } from '../../types'
import { initials } from '../../utils/format'
import { kycBadge } from '../../utils/status'

const emptyForm: NewClientInput = { name: '', email: '', phone: '', clientCode: '', password: '' }

export default function Clients() {
  const { data: users, error, loading, reload } = useAsync(() => api.admin.listUsers())
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)

  const q = query.trim().toLowerCase()
  const filtered = (users ?? []).filter((u) =>
    [u.name, u.email, u.clientCode ?? '', u.phone ?? ''].some((v) => v.toLowerCase().includes(q)),
  )
  const verified = (users ?? []).filter((u) => u.verified).length

  return (
    <div className="page">
      <PageHeader
        title="Clients"
        subtitle="Manage client accounts and the data they see"
        actions={
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <Plus size={18} /> Add client
          </button>
        }
      />

      <div className="stat-grid stat-grid-3">
        <div className="stat-card">
          <span className="stat-icon">
            <Users size={18} />
          </span>
          <span className="stat-label">Total clients</span>
          <span className="stat-value">{users?.length ?? '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon up">
            <BadgeCheck size={18} />
          </span>
          <span className="stat-label">Verified</span>
          <span className="stat-value">{users ? verified : '—'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon warn">
            <Clock size={18} />
          </span>
          <span className="stat-label">Pending verification</span>
          <span className="stat-value">{users ? users.length - verified : '—'}</span>
        </div>
      </div>

      <div className="panel panel-flush">
        <div className="panel-toolbar">
          <label className="search-box">
            <Search size={16} />
            <input placeholder="Search clients…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {loading ? (
          <div className="panel-pad">
            <Loading />
          </div>
        ) : error ? (
          <div className="panel-pad">
            <ErrorBox message={error} onRetry={reload} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title={q ? 'No clients match your search' : 'No clients yet'} text={q ? undefined : 'Add your first client to get started.'} />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>User ID</th>
                  <th>Phone</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="row-link">
                    <td>
                      <Link to={`/admin/users/${u.id}`} className="client-cell">
                        <span className="avatar avatar-sm">{initials(u.name)}</span>
                        <span>
                          <strong>{u.name}</strong>
                          <span className="muted small block">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="mono">{u.clientCode || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`chip ${kycBadge(u.kycStatus).chip}`}>{kycBadge(u.kycStatus).label}</span>
                    </td>
                    <td>
                      {u.disabled ? (
                        <span className="chip chip-down">Disabled</span>
                      ) : (
                        <span className={`chip ${u.verified ? 'chip-up' : 'chip-warn'}`}>{u.verified ? 'Verified' : 'Pending'}</span>
                      )}
                    </td>
                    <td className="cell-actions">
                      <Link to={`/admin/users/${u.id}`} className="btn btn-ghost btn-sm">
                        Manage <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && <AddClientModal onClose={() => setAdding(false)} />}
    </div>
  )
}

function AddClientModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const { saving, status, run } = useSaver()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const user = await run(() => api.admin.createUser({ ...form, clientCode: form.clientCode?.trim().toUpperCase() }))
    if (user) navigate(`/admin/users/${user.id}`)
  }

  const set = (k: keyof NewClientInput) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <Modal title="Add client" onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full name</span>
          <input className="input" value={form.name} onChange={set('name')} required autoFocus />
        </label>
        <label className="field">
          <span>User ID</span>
          <input className="input mono" value={form.clientCode} onChange={set('clientCode')} placeholder="e.g. AD89898HH" />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label className="field">
          <span>Phone</span>
          <input className="input" value={form.phone} onChange={set('phone')} />
        </label>
        <label className="field full">
          <span>Password</span>
          <input className="input" type="text" value={form.password} onChange={set('password')} minLength={6} required />
          <span className="hint">Share this with the client so they can log in.</span>
        </label>
        {status && !status.ok && <div className="alert alert-error full">{status.text}</div>}
        <div className="full form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create client'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
