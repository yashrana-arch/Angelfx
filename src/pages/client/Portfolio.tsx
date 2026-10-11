import { ArrowDownToLine, ArrowUpFromLine, Inbox, Info, TrendingDown, TrendingUp } from 'lucide-react'
import { Link } from 'react-router'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { formatINR, formatNum, pnlClass } from '../../utils/format'

export default function Portfolio() {
  const { data: p, error, loading, reload } = useAsync(() => api.client.getPortfolio())

  return (
    <div className="page">
      <PageHeader title="Portfolio" />

      {loading ? (
        <Loading rows={4} />
      ) : error || !p ? (
        <ErrorBox message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          {p.message && (
            <div className="alert alert-info">
              <Info size={18} /> <span>{p.message}</span>
            </div>
          )}

          <div className="balance-hero">
            <div>
              <span className="balance-label">Ledger balance</span>
              <div className="balance-value">{formatINR(p.ledgerBalance)}</div>
              <div className={`balance-today ${pnlClass(p.todayPnl)}`}>
                {p.todayPnl >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {formatINR(p.todayPnl)} today
              </div>
            </div>
            <div className="balance-actions">
              <Link to="/client/deposit" className="btn btn-primary btn-sm">
                <ArrowDownToLine size={16} /> Deposit
              </Link>
              <Link to="/client/withdraw" className="btn btn-glass btn-sm">
                <ArrowUpFromLine size={16} /> Withdraw
              </Link>
            </div>
          </div>

          <div className="stat-grid">
            <Stat label="Margin available" value={formatINR(p.marginAvailable)} />
            <Stat label="Margin used" value={formatINR(p.marginUsed)} />
            <Stat label="M2M" value={formatINR(p.m2m)} cls={pnlClass(p.m2m)} />
            <Stat label="Today P&L" value={formatINR(p.todayPnl)} cls={pnlClass(p.todayPnl)} />
          </div>

          <div className="section-head">
            <h2>Net positions</h2>
            {p.positions.length > 0 && (
              <span className={`strong ${pnlClass(p.positions.reduce((s, x) => s + x.pnl, 0))}`}>
                {formatINR(p.positions.reduce((s, x) => s + x.pnl, 0))}
              </span>
            )}
          </div>

          {p.positions.length === 0 ? (
            <EmptyState icon={<Inbox size={30} />} title="No open positions" text="Your open positions will show up here." />
          ) : (
            <div className="card-list">
              {p.positions.map((pos) => (
                <div key={pos.id} className="trade-card">
                  <div className="trade-top">
                    <div className="trade-title">
                      <span className={`side-badge ${pos.side === 'BUY' ? 'buy' : 'sell'}`}>{pos.side}</span>
                      <span className="stock-symbol">{pos.symbol}</span>
                    </div>
                    <span className={`trade-pnl ${pnlClass(pos.pnl)}`}>{formatINR(pos.pnl)}</span>
                  </div>
                  <div className="trade-grid trade-grid-3">
                    <div>
                      <span className="muted small">Qty</span>
                      <strong>{pos.quantity}</strong>
                    </div>
                    <div>
                      <span className="muted small">Avg</span>
                      <strong>{formatNum(pos.avgPrice)}</strong>
                    </div>
                    <div>
                      <span className="muted small">LTP</span>
                      <strong>{formatNum(pos.ltp)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${cls}`}>{value}</span>
    </div>
  )
}
