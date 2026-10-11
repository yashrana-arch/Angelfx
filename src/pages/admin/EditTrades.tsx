import { Inbox, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import Modal from '../../components/Modal'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { Trade, TradeInput, TradeStatus } from '../../types'
import { formatDateTime, formatINR, formatNum, pnlClass } from '../../utils/format'
import { useClient } from './ClientDetail'

const FILTERS: (TradeStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACTIVE', 'CLOSED']

/** yyyy-mm-ddThh:mm in local time, for datetime-local inputs. */
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const blankTrade = (): TradeInput => ({
  symbol: '',
  side: 'BUY',
  orderType: 'MARKET',
  quantity: 1,
  entryPrice: 0,
  exitPrice: null,
  pnl: 0,
  status: 'ACTIVE',
  date: new Date().toISOString(),
})

const calcPnl = (t: TradeInput) =>
  t.exitPrice == null
    ? t.pnl
    : +((t.side === 'BUY' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice) * t.quantity).toFixed(2)

export default function EditTrades() {
  const { user } = useClient()
  const { data: trades, setData, error, loading, reload } = useAsync(() => api.admin.getTrades(user.id), [user.id])
  const [filter, setFilter] = useState<TradeStatus | 'ALL'>('ALL')
  const [editing, setEditing] = useState<Trade | 'new' | null>(null)

  if (loading) return <Loading />
  if (error || !trades) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />

  const list = trades.filter((t) => filter === 'ALL' || t.status === filter).sort((a, b) => b.date.localeCompare(a.date))

  async function handleDelete(t: Trade) {
    if (!confirm(`Delete ${t.symbol} trade?`)) return
    try {
      await api.admin.deleteTrade(user.id, t.id)
      setData(trades!.filter((x) => x.id !== t.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  function handleSaved(saved: Trade) {
    const exists = trades!.some((t) => t.id === saved.id)
    setData(exists ? trades!.map((t) => (t.id === saved.id ? saved : t)) : [...trades!, saved])
    setEditing(null)
  }

  return (
    <div className="panel panel-flush">
      <div className="panel-toolbar">
        <div className="segmented segmented-sm">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f[0] + f.slice(1).toLowerCase()}
              <span className="seg-count">{f === 'ALL' ? trades.length : trades.filter((t) => t.status === f).length}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={16} /> Add trade
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Inbox size={28} />} title="No trades here" text="Add a trade and it will appear on the client’s Trades page." />
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Status</th>
                <th className="num">Qty</th>
                <th className="num">Entry</th>
                <th className="num">Exit</th>
                <th className="num">P&amp;L</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="nowrap">{formatDateTime(t.date)}</td>
                  <td>
                    <strong>{t.symbol}</strong>
                    <span className="muted small block">{t.orderType}</span>
                  </td>
                  <td>
                    <span className={`side-badge ${t.side === 'BUY' ? 'buy' : 'sell'}`}>{t.side}</span>
                  </td>
                  <td>
                    <span className="chip">{t.status}</span>
                  </td>
                  <td className="num">{t.quantity}</td>
                  <td className="num">{formatNum(t.entryPrice)}</td>
                  <td className="num">{t.exitPrice == null ? '—' : formatNum(t.exitPrice)}</td>
                  <td className={`num strong ${pnlClass(t.pnl)}`}>{formatINR(t.pnl)}</td>
                  <td className="cell-actions">
                    <button className="icon-btn" onClick={() => setEditing(t)} aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(t)} aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <TradeModal userId={user.id} trade={editing === 'new' ? null : editing} onSaved={handleSaved} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

interface ModalProps {
  userId: string
  trade: Trade | null
  onSaved: (t: Trade) => void
  onClose: () => void
}

function TradeModal({ userId, trade, onSaved, onClose }: ModalProps) {
  const [form, setForm] = useState<TradeInput>(() => {
    if (!trade) return blankTrade()
    const { symbol, side, orderType, quantity, entryPrice, exitPrice, pnl, status, date } = trade
    return { symbol, side, orderType, quantity, entryPrice, exitPrice, pnl, status, date }
  })
  const { saving, status, run } = useSaver()

  const set = <K extends keyof TradeInput>(key: K, value: TradeInput[K]) => {
    const next = { ...form, [key]: value }
    if (['side', 'quantity', 'entryPrice', 'exitPrice'].includes(key)) next.pnl = calcPnl(next)
    setForm(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const payload = { ...form, symbol: form.symbol.trim().toUpperCase() }
    const saved = await run(() => (trade ? api.admin.updateTrade(userId, trade.id, payload) : api.admin.addTrade(userId, payload)))
    if (saved) onSaved(saved)
  }

  return (
    <Modal title={trade ? 'Edit trade' : 'Add trade'} onClose={onClose} width={640}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Symbol</span>
          <input className="input" value={form.symbol} onChange={(e) => set('symbol', e.target.value)} placeholder="e.g. NIFTY 22500 CE" required autoFocus />
        </label>
        <label className="field">
          <span>Date & time</span>
          <input className="input" type="datetime-local" value={toLocalInput(form.date)} onChange={(e) => e.target.value && set('date', new Date(e.target.value).toISOString())} required />
        </label>
        <label className="field">
          <span>Side</span>
          <div className="segmented segmented-sm segmented-fill">
            {(['BUY', 'SELL'] as const).map((s) => (
              <button key={s} type="button" className={form.side === s ? `active ${s === 'BUY' ? 'buy' : 'sell'}` : ''} onClick={() => set('side', s)}>
                {s}
              </button>
            ))}
          </div>
        </label>
        <label className="field">
          <span>Status</span>
          <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as TradeStatus)}>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label className="field">
          <span>Order type</span>
          <select className="input" value={form.orderType} onChange={(e) => set('orderType', e.target.value as TradeInput['orderType'])}>
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
          </select>
        </label>
        <label className="field">
          <span>Quantity</span>
          <input className="input" type="number" min="0" step="any" value={form.quantity} onChange={(e) => set('quantity', Number(e.target.value))} required />
        </label>
        <label className="field">
          <span>Entry price (₹)</span>
          <input className="input" type="number" step="0.01" value={form.entryPrice} onChange={(e) => set('entryPrice', Number(e.target.value))} required />
        </label>
        <label className="field">
          <span>Exit price (₹)</span>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.exitPrice ?? ''}
            placeholder="Empty if still open"
            onChange={(e) => set('exitPrice', e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>
        <label className="field full">
          <span>P&amp;L (₹)</span>
          <input className="input" type="number" step="0.01" value={form.pnl} onChange={(e) => set('pnl', Number(e.target.value))} required />
          <span className="hint">Auto-calculated when an exit price is set. For active trades, enter the current unrealised P&amp;L.</span>
        </label>
        {status && !status.ok && <div className="alert alert-error full">{status.text}</div>}
        <div className="full form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save trade'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
