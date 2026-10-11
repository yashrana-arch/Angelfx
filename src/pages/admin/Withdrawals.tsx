import { ArrowUpFromLine, Check, X } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { Withdrawal, WithdrawalStatus } from '../../types'
import { errorMessage, formatDateTime, formatINR } from '../../utils/format'
import { withdrawalChip } from '../../utils/status'
import { useClient } from './ClientDetail'

export default function Withdrawals() {
  const { user } = useClient()
  const { data, setData, error, loading, reload } = useAsync(() => api.admin.getWithdrawals(user.id), [user.id])

  if (loading) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />

  if (data.length === 0) {
    return (
      <div className="panel">
        <EmptyState icon={<ArrowUpFromLine size={28} />} title="No withdrawal requests" text="Requests the client submits from their Withdraw page show up here." />
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="list-panel">
      {sorted.map((w) => (
        <WithdrawalRow key={w.id} userId={user.id} w={w} onUpdated={(u) => setData(data.map((x) => (x.id === u.id ? u : x)))} />
      ))}
    </div>
  )
}

function WithdrawalRow({ userId, w, onUpdated }: { userId: string; w: Withdrawal; onUpdated: (w: Withdrawal) => void }) {
  const [note, setNote] = useState(w.adminNote)
  const [busy, setBusy] = useState(false)

  async function decide(status: WithdrawalStatus) {
    setBusy(true)
    try {
      onUpdated(await api.admin.updateWithdrawal(userId, w.id, status, note.trim()))
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="list-row withdrawal-row">
      <div className="withdrawal-info">
        <div className="row-gap">
          <strong className="text-lg">{formatINR(w.amount)}</strong>
          <span className={`chip ${withdrawalChip[w.status]}`}>{w.status}</span>
        </div>
        <div className="muted small">Requested {formatDateTime(w.createdAt)}</div>
        <div className="small">
          Pay to: <span className="mono">{w.accountDetails}</span>
        </div>
        {w.status !== 'PENDING' && w.adminNote && <div className="small muted">Note: {w.adminNote}</div>}
      </div>
      {w.status === 'PENDING' && (
        <div className="withdrawal-actions">
          <input className="input input-sm" placeholder="Note for client (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="row-gap">
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => decide('APPROVED')}>
              <Check size={16} /> Approve
            </button>
            <button className="btn btn-danger-soft btn-sm" disabled={busy} onClick={() => decide('REJECTED')}>
              <X size={16} /> Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
