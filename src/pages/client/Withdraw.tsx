import { Clock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { withdrawalChip } from '../../utils/status'
import { errorMessage, formatDateTime, formatINR } from '../../utils/format'


export default function Withdraw() {
  const portfolio = useAsync(() => api.client.getPortfolio())
  const history = useAsync(() => api.client.getWithdrawals())
  const [amount, setAmount] = useState('')
  const [account, setAccount] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const available = portfolio.data?.marginAvailable ?? 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const w = await api.client.requestWithdrawal({ amount: Number(amount), accountDetails: account.trim() })
      history.setData([w, ...(history.data ?? [])])
      setAmount('')
      setStatus({ ok: true, text: 'Withdrawal request submitted. You’ll be notified once it’s processed.' })
    } catch (err) {
      setStatus({ ok: false, text: errorMessage(err, 'Request failed') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page page-narrow">
      <PageHeader title="Withdraw" subtitle="Request a payout to your UPI or bank" back="/client/profile" />

      <form className="panel form-stack" onSubmit={handleSubmit}>
        <div className="row-between">
          <span className="muted">Available to withdraw</span>
          <strong className="text-lg">{portfolio.loading ? '…' : formatINR(available)}</strong>
        </div>
        <label className="field">
          <span>Amount (₹)</span>
          <input className="input input-lg" type="number" min="1" step="0.01" max={available || undefined} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        </label>
        <div className="quick-amounts">
          {[1000, 5000, 10000].map((v) => (
            <button key={v} type="button" className="chip-btn" onClick={() => setAmount(String(Math.min(v, available)))} disabled={!available}>
              ₹{v.toLocaleString('en-IN')}
            </button>
          ))}
          <button type="button" className="chip-btn" onClick={() => setAmount(String(available))} disabled={!available}>
            Max
          </button>
        </div>
        <label className="field">
          <span>UPI ID or bank account details</span>
          <textarea className="input" rows={2} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="name@okaxis  or  A/C no, IFSC, name" required />
        </label>
        {status && <div className={`alert ${status.ok ? 'alert-success' : 'alert-error'}`}>{status.text}</div>}
        <button className="btn btn-primary btn-block" disabled={saving || !available}>
          {saving ? 'Submitting…' : 'Request withdrawal'}
        </button>
      </form>

      <div className="section-head">
        <h2>History</h2>
      </div>
      {history.loading ? (
        <Loading rows={2} />
      ) : history.error ? (
        <ErrorBox message={history.error} onRetry={history.reload} />
      ) : (history.data ?? []).length === 0 ? (
        <EmptyState icon={<Clock size={28} />} title="No withdrawal requests yet" />
      ) : (
        <div className="list-panel">
          {history.data!.map((w) => (
            <div key={w.id} className="list-row">
              <div>
                <strong>{formatINR(w.amount)}</strong>
                <div className="muted small">
                  {formatDateTime(w.createdAt)} · {w.accountDetails}
                </div>
                {w.adminNote && <div className="small">Note: {w.adminNote}</div>}
              </div>
              <span className={`chip ${withdrawalChip[w.status]}`}>{w.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
