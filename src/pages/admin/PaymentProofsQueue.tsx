import { Receipt } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { PaymentProofStatus } from '../../types'
import ProofReviewRow from './ProofReviewRow'

const FILTERS: { value: PaymentProofStatus | 'ALL'; label: string }[] = [
  { value: 'PENDING', label: 'To review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ALL', label: 'All' },
]

/** Payment screenshots from every client, starting with the ones waiting for review. */
export default function PaymentProofsQueue() {
  const [filter, setFilter] = useState<PaymentProofStatus | 'ALL'>('PENDING')
  const { data, setData, error, loading, reload } = useAsync(
    () => api.admin.listPaymentProofs(filter === 'ALL' ? undefined : filter),
    [filter],
  )

  return (
    <div className="page">
      <PageHeader title="Payment proofs" subtitle="Screenshots clients upload after paying. Verify, then credit their ledger." />

      <div className="segmented segmented-sm">
        {FILTERS.map((f) => (
          <button key={f.value} className={filter === f.value ? 'active' : ''} onClick={() => setFilter(f.value)}>
            {f.label}
            {f.value === 'PENDING' && filter === 'PENDING' && data && data.length > 0 && <span className="seg-count">{data.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorBox message={error ?? 'No data'} onRetry={reload} />
      ) : data.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<Receipt size={28} />} title={filter === 'PENDING' ? 'All caught up' : 'Nothing here'} text={filter === 'PENDING' ? 'No screenshots are waiting for review.' : undefined} />
        </div>
      ) : (
        <div className="list-panel">
          {data.map((p) => (
            <ProofReviewRow
              key={p.id}
              p={p}
              showClient
              // Reviewed items drop out of the "To review" list; elsewhere they update in place.
              onUpdated={(u) =>
                setData(filter === 'ALL' || u.status === filter ? data.map((x) => (x.id === u.id ? u : x)) : data.filter((x) => x.id !== u.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
