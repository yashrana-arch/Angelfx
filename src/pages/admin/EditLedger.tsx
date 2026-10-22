import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import RowsEditor, { type Column } from '../../components/RowsEditor'
import SaveBar from '../../components/SaveBar'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { LedgerEntry } from '../../types'
import { formatINR, tempId } from '../../utils/format'
import { withRunningBalance } from '../../utils/ledger'
import { useClient } from './ClientDetail'

const cols: Column<LedgerEntry>[] = [
  { key: 'date', label: 'Date', type: 'date', width: 150 },
  { key: 'description', label: 'Description', width: 220, placeholder: 'UPI deposit' },
  { key: 'type', label: 'Type', type: 'select', options: ['CREDIT', 'DEBIT'], width: 110 },
  { key: 'amount', label: 'Amount (₹)', type: 'number', width: 130 },
]

export default function EditLedger() {
  const { user } = useClient()
  const { data, error, loading, reload } = useAsync(() => api.admin.getLedger(user.id), [user.id])

  if (loading) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />
  return <LedgerForm userId={user.id} initial={data} />
}

function LedgerForm({ userId, initial }: { userId: string; initial: LedgerEntry[] }) {
  const [rows, setRows] = useState(initial)
  const { saving, status, run } = useSaver()
  const balance = withRunningBalance(rows).at(-1)?.balance ?? 0

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const saved = await run(() => api.admin.updateLedger(userId, rows.filter((r) => r.amount > 0)))
    if (saved) setRows(saved)
  }

  return (
    <form className="stack" onSubmit={handleSave}>
      <section className="panel">
        <div className="panel-head">
          <h2>Ledger entries</h2>
          <span className="muted small">
            Manual entries total <strong className="text-h">{formatINR(balance)}</strong>
          </span>
        </div>
        <RowsEditor
          columns={cols}
          rows={rows}
          onChange={setRows}
          newRow={(): LedgerEntry => ({ id: tempId(), date: new Date().toISOString().slice(0, 10), description: '', type: 'CREDIT', amount: 0 })}
          addLabel="Add entry"
          emptyText="No ledger entries."
        />
        <p className="hint">Funds added from the Portfolio tab appear here, and you can fix or remove them. Approved withdrawals and closed-trade P&amp;L are added to the client’s ledger automatically, so don’t enter them here. The full balance is on the Portfolio tab.</p>
      </section>
      <SaveBar saving={saving} status={status} label="Save ledger" />
    </form>
  )
}
