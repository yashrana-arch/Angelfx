import { BookOpen } from 'lucide-react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { withRunningBalance } from '../../utils/ledger'
import { formatDate, formatINR } from '../../utils/format'

export default function Ledger() {
  const { data, error, loading, reload } = useAsync(() => api.client.getLedger())
  const rows = withRunningBalance(data ?? [])
  const closing = rows.at(-1)?.balance ?? 0

  return (
    <div className="page page-narrow">
      <PageHeader title="Ledger" subtitle="All credits and debits on your account" back="/client/profile" />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<BookOpen size={28} />} title="No ledger entries yet" />
      ) : (
        <>
          <div className="summary-bar">
            <span className="muted">Closing balance</span>
            <strong>{formatINR(closing)}</strong>
          </div>
          <div className="list-panel">
            {[...rows].reverse().map((r) => (
              <div key={r.id} className="list-row">
                <div>
                  <strong>{r.description || (r.type === 'CREDIT' ? 'Credit' : 'Debit')}</strong>
                  <div className="muted small">{formatDate(r.date)}</div>
                </div>
                <div className="right">
                  <strong className={r.type === 'CREDIT' ? 'up' : 'down'}>
                    {r.type === 'CREDIT' ? '+' : '−'}
                    {formatINR(r.amount)}
                  </strong>
                  <div className="muted small">Bal {formatINR(r.balance)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
