import { Receipt } from 'lucide-react'
import { api } from '../../api'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useClient } from './ClientDetail'
import ProofReviewRow from './ProofReviewRow'

/** "Deposits" tab: the payment screenshots this client uploaded. */
export default function ClientPaymentProofs() {
  const { user } = useClient()
  const { data, setData, error, loading, reload } = useAsync(() => api.admin.getPaymentProofs(user.id), [user.id])

  if (loading) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? 'No data'} onRetry={reload} />

  if (data.length === 0) {
    return (
      <div className="panel">
        <EmptyState icon={<Receipt size={28} />} title="No payment screenshots" text="Screenshots the client uploads from their Deposit page show up here." />
      </div>
    )
  }

  return (
    <div className="list-panel">
      {data.map((p) => (
        <ProofReviewRow key={p.id} p={p} onUpdated={(u) => setData(data.map((x) => (x.id === u.id ? u : x)))} />
      ))}
    </div>
  )
}
