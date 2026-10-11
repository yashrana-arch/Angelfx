import { Inbox } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { Trade, TradeStatus } from '../../types'
import { formatDateTime, formatINR, formatNum, pnlClass } from '../../utils/format'

const TABS: { key: TradeStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'CLOSED', label: 'Closed' },
]

export default function Trades() {
  const { data: trades, error, loading, reload } = useAsync(() => api.client.getTrades())
  const [tab, setTab] = useState<TradeStatus>('ACTIVE')

  const list = (trades ?? []).filter((t) => t.status === tab).sort((a, b) => b.date.localeCompare(a.date))
  const total = list.reduce((s, t) => s + t.pnl, 0)

  return (
    <div className="page">
      <PageHeader title="Trades" />

      <div className="segmented" role="tablist">
        {TABS.map((t) => {
          const count = (trades ?? []).filter((x) => x.status === t.key).length
          return (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              {t.label}
              {count > 0 && <span className="seg-count">{count}</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Inbox size={30} />}
          title={`No ${tab.toLowerCase()} orders`}
          text="Your orders will appear here once they are placed."
          action={
            <Link to="/client" className="btn btn-ghost btn-sm">
              Go to watchlist
            </Link>
          }
        />
      ) : (
        <>
          {tab !== 'PENDING' && (
            <div className="summary-bar">
              <span className="muted">{tab === 'ACTIVE' ? 'Unrealised P&L' : 'Realised P&L'}</span>
              <strong className={pnlClass(total)}>{formatINR(total)}</strong>
            </div>
          )}
          <div className="card-list">
            {list.map((t) => (
              <TradeCard key={t.id} trade={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TradeCard({ trade: t }: { trade: Trade }) {
  return (
    <div className="trade-card">
      <div className="trade-top">
        <div className="trade-title">
          <span className={`side-badge ${t.side === 'BUY' ? 'buy' : 'sell'}`}>{t.side}</span>
          <span className="stock-symbol">{t.symbol}</span>
        </div>
        {t.status !== 'PENDING' && <span className={`trade-pnl ${pnlClass(t.pnl)}`}>{formatINR(t.pnl)}</span>}
      </div>
      <div className="trade-grid">
        <div>
          <span className="muted small">Qty</span>
          <strong>{t.quantity}</strong>
        </div>
        <div>
          <span className="muted small">{t.status === 'PENDING' ? 'Limit price' : 'Entry'}</span>
          <strong>{formatNum(t.entryPrice)}</strong>
        </div>
        <div>
          <span className="muted small">Exit</span>
          <strong>{t.exitPrice == null ? '—' : formatNum(t.exitPrice)}</strong>
        </div>
        <div>
          <span className="muted small">Type</span>
          <strong>{t.orderType}</strong>
        </div>
      </div>
      <div className="trade-foot muted small">{formatDateTime(t.date)}</div>
    </div>
  )
}
