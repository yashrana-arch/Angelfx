import { Search, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import Sparkline from '../../components/Sparkline'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { MarketIndex, Stock } from '../../types'
import { formatInt, formatNum, formatPct, formatSigned, pnlClass } from '../../utils/format'

const INDEX_COLORS = ['#a855f7', '#ff9f2e', '#3b82f6', '#14b8a6', '#ec4899']

export default function Watchlist() {
  const { data, error, loading, reload } = useAsync(() => api.market.get())
  const [query, setQuery] = useState('')

  const stocks = useMemo(
    () => (data?.stocks ?? []).filter((s) => s.symbol.toLowerCase().includes(query.trim().toLowerCase())),
    [data, query],
  )

  return (
    <div className="page">
      <PageHeader
        title="Market Watch"
        subtitle={
          <>
            <span className="live-dot" /> Live market overview
          </>
        }
      />

      {loading ? (
        <Loading rows={5} />
      ) : error || !data ? (
        <ErrorBox message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          {data.indices.length > 0 && (
            <div className="index-strip">
              {data.indices.map((idx, i) => (
                <IndexCard key={idx.id} index={idx} color={INDEX_COLORS[i % INDEX_COLORS.length]!} />
              ))}
            </div>
          )}

          <div className="section-head">
            <h2>Watchlist</h2>
            <label className="search-box">
              <Search size={16} />
              <input placeholder="Search symbol" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
          </div>

          {stocks.length === 0 ? (
            <EmptyState icon={<Search size={28} />} title={query ? 'No matching symbols' : 'Watchlist is empty'} />
          ) : (
            <div className="stock-list">
              {stocks.map((s) => (
                <StockRow key={s.id} stock={s} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function IndexCard({ index, color }: { index: MarketIndex; color: string }) {
  const cls = pnlClass(index.change)
  return (
    <div className="index-card" style={{ '--idx': color } as React.CSSProperties}>
      <div className="index-name">{index.name}</div>
      <div className="index-value">{formatNum(index.value)}</div>
      <Sparkline seed={index.name} trend={index.change} color={color} height={52} />
      <div className={`index-change ${cls}`}>
        {index.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {formatSigned(index.change)} <span>({formatPct(index.changePct)})</span>
      </div>
    </div>
  )
}

function StockRow({ stock }: { stock: Stock }) {
  const cls = pnlClass(stock.changePct)
  const range = stock.high - stock.low
  const pos = range > 0 ? Math.min(100, Math.max(0, ((stock.price - stock.low) / range) * 100)) : 50

  return (
    <div className="stock-row">
      <div className="stock-main">
        <div className="stock-left">
          <div className={`stock-avatar ${cls}`}>{stock.symbol.slice(0, 2)}</div>
          <div>
            <div className="stock-symbol">{stock.symbol}</div>
            <div className="muted small">Vol {formatInt(stock.volume)}</div>
          </div>
        </div>
        <div className="stock-right">
          <div className="stock-price">₹{formatNum(stock.price)}</div>
          <span className={`chip chip-${cls}`}>{formatPct(stock.changePct)}</span>
        </div>
      </div>
      <div className="stock-range">
        <span className="small">
          <span className="muted">L </span>
          {formatNum(stock.low)}
        </span>
        <div className="range-bar">
          <div className="range-fill" style={{ width: `${pos}%` }} />
          <div className="range-dot" style={{ left: `${pos}%` }} />
        </div>
        <span className="small">
          <span className="muted">H </span>
          {formatNum(stock.high)}
        </span>
      </div>
    </div>
  )
}
