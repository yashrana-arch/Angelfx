import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import RowsEditor, { type Column } from '../../components/RowsEditor'
import SaveBar from '../../components/SaveBar'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { Portfolio, Position } from '../../types'
import { tempId } from '../../utils/format'
import { useClient } from './ClientDetail'

const fields: { key: keyof Omit<Portfolio, 'message' | 'positions'>; label: string }[] = [
  { key: 'ledgerBalance', label: 'Ledger balance (₹)' },
  { key: 'marginAvailable', label: 'Margin available (₹)' },
  { key: 'marginUsed', label: 'Margin used (₹)' },
  { key: 'm2m', label: 'M2M (₹)' },
  { key: 'todayPnl', label: 'Today P&L (₹)' },
]

const positionCols: Column<Position>[] = [
  { key: 'symbol', label: 'Symbol', width: 160, placeholder: 'NIFTY 22500 CE' },
  { key: 'side', label: 'Side', type: 'select', options: ['BUY', 'SELL'], width: 90 },
  { key: 'quantity', label: 'Qty', type: 'number', width: 90 },
  { key: 'avgPrice', label: 'Avg price', type: 'number', width: 110 },
  { key: 'ltp', label: 'LTP', type: 'number', width: 110 },
  { key: 'pnl', label: 'P&L', type: 'number', width: 110 },
]

export default function EditPortfolio() {
  const { user } = useClient()
  const { data, error, loading, reload } = useAsync(() => api.admin.getPortfolio(user.id), [user.id])

  if (loading) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />
  return <PortfolioForm userId={user.id} initial={data} />
}

function PortfolioForm({ userId, initial }: { userId: string; initial: Portfolio }) {
  const [form, setForm] = useState(initial)
  const { saving, status, run } = useSaver()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const clean = { ...form, positions: form.positions.filter((p) => p.symbol.trim()) }
    const saved = await run(() => api.admin.updatePortfolio(userId, clean))
    if (saved) setForm(saved)
  }

  // Positions P&L follows from avg/LTP unless the admin overrides it.
  function onPositions(rows: Position[]) {
    setForm({
      ...form,
      positions: rows.map((r) => {
        const prev = form.positions.find((p) => p.id === r.id)
        const priceChanged = !prev || prev.avgPrice !== r.avgPrice || prev.ltp !== r.ltp || prev.quantity !== r.quantity || prev.side !== r.side
        if (!priceChanged || prev?.pnl !== r.pnl) return r
        const diff = r.side === 'BUY' ? r.ltp - r.avgPrice : r.avgPrice - r.ltp
        return { ...r, pnl: +(diff * r.quantity).toFixed(2) }
      }),
    })
  }

  return (
    <form className="stack" onSubmit={handleSave}>
      <section className="panel">
        <div className="panel-head">
          <h2>Account summary</h2>
          <span className="muted small">Shown on the client’s Portfolio and Profile pages</span>
        </div>
        <div className="form-grid form-grid-3">
          {fields.map(({ key, label }) => (
            <label key={key} className="field">
              <span>{label}</span>
              <input className="input" type="number" step="0.01" value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} required />
            </label>
          ))}
          <label className="field full">
            <span>Announcement for client (optional)</span>
            <input className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="e.g. Market closed tomorrow for holiday" />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Net positions</h2>
          <span className="muted small">P&amp;L is auto-calculated from avg & LTP; you can override it</span>
        </div>
        <RowsEditor
          columns={positionCols}
          rows={form.positions}
          onChange={onPositions}
          newRow={(): Position => ({ id: tempId(), symbol: '', side: 'BUY', quantity: 1, avgPrice: 0, ltp: 0, pnl: 0 })}
          addLabel="Add position"
          emptyText="No open positions."
        />
      </section>

      <SaveBar saving={saving} status={status} label="Save portfolio" />
    </form>
  )
}
