import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import SaveBar from '../../components/SaveBar'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { Portfolio } from '../../types'
import { formatINR, formatNum, pnlClass } from '../../utils/format'
import { useClient } from './ClientDetail'

const fields: { key: keyof Omit<Portfolio, 'message' | 'positions'>; label: string; pnl?: boolean }[] = [
  { key: 'ledgerBalance', label: 'Ledger balance' },
  { key: 'marginAvailable', label: 'Margin available' },
  { key: 'marginUsed', label: 'Margin used' },
  { key: 'm2m', label: 'M2M', pnl: true },
  { key: 'todayPnl', label: 'Today P&L', pnl: true },
]

export default function EditPortfolio() {
  const { user } = useClient()
  const { data, setData, error, loading, reload } = useAsync(() => api.admin.getPortfolio(user.id), [user.id])

  if (loading) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />
  return (
    <div className="stack">
      <AddFunds userId={user.id} onAdded={async () => setData(await api.admin.getPortfolio(user.id))} />
      <PortfolioForm userId={user.id} portfolio={data} />
    </div>
  )
}

/** Credits the client's account, e.g. once their payment is confirmed. */
function AddFunds({ userId, onAdded }: { userId: string; onAdded: () => Promise<void> }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const { saving, status, run } = useSaver()

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!confirm(`Add ${formatINR(value)} to this client's account?`)) return
    const entry = await run(() => api.admin.addFunds(userId, { amount: value, description: note.trim() || undefined }), `${formatINR(value)} added`)
    if (!entry) return
    setAmount('')
    setNote('')
    await onAdded()
  }

  return (
    <form className="panel" onSubmit={handleAdd}>
      <div className="panel-head">
        <h2>Add funds</h2>
        <span className="muted small">Credits the client’s ledger, e.g. after you confirm their payment</span>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Amount (₹)</span>
          <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Funds added" maxLength={250} />
        </label>
        <div className="full form-actions">
          {status && <span className={status.ok ? 'up' : 'down'}>{status.text}</span>}
          <button className="btn btn-primary" disabled={saving}>
            <Plus size={18} /> {saving ? 'Adding…' : 'Add funds'}
          </button>
        </div>
      </div>
    </form>
  )
}

function PortfolioForm({ userId, portfolio }: { userId: string; portfolio: Portfolio }) {
  const [message, setMessage] = useState(portfolio.message)
  const { saving, status, run } = useSaver()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const saved = await run(() => api.admin.updatePortfolio(userId, { ...portfolio, message }))
    if (saved) setMessage(saved.message)
  }

  return (
    <form className="stack" onSubmit={handleSave}>
      <section className="panel">
        <div className="panel-head">
          <h2>Account summary</h2>
          <span className="muted small">Calculated automatically from funds added, trades and withdrawals</span>
        </div>
        <div className="stat-grid">
          {fields.map(({ key, label, pnl }) => (
            <div key={key} className="stat-card">
              <span className="stat-label">{label}</span>
              <span className={`stat-value ${pnl ? pnlClass(portfolio[key]) : ''}`}>{formatINR(portfolio[key])}</span>
            </div>
          ))}
        </div>
        <p className="hint">
          Ledger balance = funds added and other ledger entries + closed-trade P&amp;L − approved withdrawals. M2M is the P&amp;L of active trades. Margin
          used is the entry value of active and pending trades. Margin available = ledger balance − margin used − pending withdrawals, minus any M2M
          loss.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Net positions</h2>
          <span className="muted small">Active trades, managed on the Trades tab</span>
        </div>
        {portfolio.positions.length === 0 ? (
          <p className="muted">No open positions.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th className="num">Qty</th>
                  <th className="num">Avg price</th>
                  <th className="num">LTP</th>
                  <th className="num">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.positions.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.symbol}</strong>
                    </td>
                    <td>
                      <span className={`side-badge ${p.side === 'BUY' ? 'buy' : 'sell'}`}>{p.side}</span>
                    </td>
                    <td className="num">{p.quantity}</td>
                    <td className="num">{formatNum(p.avgPrice)}</td>
                    <td className="num">{formatNum(p.ltp)}</td>
                    <td className={`num strong ${pnlClass(p.pnl)}`}>{formatINR(p.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <label className="field">
          <span>Announcement for client (optional)</span>
          <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Market closed tomorrow for holiday" />
        </label>
      </section>

      <SaveBar saving={saving} status={status} label="Save announcement" />
    </form>
  )
}
