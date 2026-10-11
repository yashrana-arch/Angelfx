import SaveBar from '../../components/SaveBar'
import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import RowsEditor, { type Column } from '../../components/RowsEditor'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { MarketIndex, MarketWatch, Stock } from '../../types'
import { tempId } from '../../utils/format'

const indexCols: Column<MarketIndex>[] = [
  { key: 'name', label: 'Index', width: 160, placeholder: 'Nifty 50' },
  { key: 'value', label: 'Value', type: 'number', width: 120 },
  { key: 'change', label: 'Change', type: 'number', width: 110 },
  { key: 'changePct', label: 'Change %', type: 'number', width: 100 },
]

const stockCols: Column<Stock>[] = [
  { key: 'symbol', label: 'Symbol', width: 140, placeholder: 'RELIANCE' },
  { key: 'price', label: 'Price', type: 'number', width: 110 },
  { key: 'changePct', label: 'Change %', type: 'number', width: 100 },
  { key: 'volume', label: 'Volume', type: 'number', width: 120 },
  { key: 'low', label: 'Low', type: 'number', width: 110 },
  { key: 'high', label: 'High', type: 'number', width: 110 },
]

export default function MarketWatchEditor() {
  const { data, error, loading, reload } = useAsync(() => api.market.get())

  return (
    <div className="page">
      <PageHeader title="Market Watch" subtitle="Indices and stocks shown on every client’s watchlist" />
      {loading ? <Loading /> : error || !data ? <ErrorBox message={error ?? 'No data'} onRetry={reload} /> : <MarketForm initial={data} />}
    </div>
  )
}

function MarketForm({ initial }: { initial: MarketWatch }) {
  const [market, setMarket] = useState(initial)
  const { saving, status, run } = useSaver()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const clean: MarketWatch = {
      indices: market.indices.filter((i) => i.name.trim()),
      stocks: market.stocks.filter((s) => s.symbol.trim()).map((s) => ({ ...s, symbol: s.symbol.trim().toUpperCase() })),
    }
    const saved = await run(() => api.admin.updateMarket(clean), 'Market watch updated for all clients')
    if (saved) setMarket(saved)
  }

  return (
    <form className="stack" onSubmit={handleSave}>
      <section className="panel">
        <div className="panel-head">
          <h2>Indices</h2>
          <span className="muted small">Shown as cards with a chart at the top of the watchlist</span>
        </div>
        <RowsEditor
          columns={indexCols}
          rows={market.indices}
          onChange={(indices) => setMarket({ ...market, indices })}
          newRow={() => ({ id: tempId(), name: '', value: 0, change: 0, changePct: 0 })}
          addLabel="Add index"
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Stocks</h2>
          <span className="muted small">{market.stocks.length} symbols</span>
        </div>
        <RowsEditor
          columns={stockCols}
          rows={market.stocks}
          onChange={(stocks) => setMarket({ ...market, stocks })}
          newRow={() => ({ id: tempId(), symbol: '', price: 0, changePct: 0, volume: 0, low: 0, high: 0 })}
          addLabel="Add stock"
        />
      </section>

      <SaveBar saving={saving} status={status} label="Save market watch" />
    </form>
  )
}
