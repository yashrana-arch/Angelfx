import { BookOpen, Check, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api'
import ProofImage from '../../components/ProofImage'
import type { PaymentProof, PaymentProofStatus } from '../../types'
import { errorMessage, formatDateTime, formatINR } from '../../utils/format'
import { proofChip, proofLabel } from '../../utils/status'

/** One payment screenshot with approve / reject controls. Used on the client tab and the review queue. */
export default function ProofReviewRow({ p, showClient, onUpdated }: { p: PaymentProof; showClient?: boolean; onUpdated: (p: PaymentProof) => void }) {
  const [note, setNote] = useState(p.adminNote)
  const [busy, setBusy] = useState(false)

  async function decide(status: PaymentProofStatus) {
    setBusy(true)
    try {
      onUpdated(await api.admin.updatePaymentProof(p.userId, p.id, status, note.trim()))
    } catch (err) {
      alert(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="list-row proof-row proof-review">
      <ProofImage load={() => api.admin.getPaymentProofImage(p.userId, p.id)} alt={p.fileName} />
      <div className="proof-info">
        <div className="row-gap">
          <strong className="text-lg">{p.amount != null ? formatINR(p.amount) : 'No amount entered'}</strong>
          <span className={`chip ${proofChip[p.status]}`}>{proofLabel[p.status]}</span>
        </div>
        {showClient && (
          <Link to={`/admin/users/${p.userId}/deposits`} className="small strong">
            {p.clientName}
            {p.clientCode && <span className="mono muted"> · {p.clientCode}</span>}
          </Link>
        )}
        <span className="muted small">
          Uploaded {formatDateTime(p.createdAt)}
          {p.reviewedAt && ` · Reviewed ${formatDateTime(p.reviewedAt)}`}
        </span>
        {p.reference && (
          <span className="small">
            UTR: <span className="mono">{p.reference}</span>
          </span>
        )}
        {p.status !== 'PENDING' && p.adminNote && <span className="small muted">Note: {p.adminNote}</span>}
      </div>

      {p.status === 'PENDING' ? (
        <div className="withdrawal-actions">
          <input className="input input-sm" placeholder="Note for client (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          <div className="row-gap">
            <button className="btn btn-success btn-sm" disabled={busy} onClick={() => decide('APPROVED')}>
              <Check size={16} /> Approve
            </button>
            <button className="btn btn-danger-soft btn-sm" disabled={busy} onClick={() => decide('REJECTED')}>
              <X size={16} /> Reject
            </button>
          </div>
          <span className="hint">Approving doesn’t add funds. Credit the amount on the client’s Ledger tab.</span>
        </div>
      ) : (
        <div className="row-gap">
          {p.status === 'APPROVED' && (
            <Link to={`/admin/users/${p.userId}/ledger`} className="btn btn-ghost btn-sm">
              <BookOpen size={16} /> Ledger
            </Link>
          )}
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => decide('PENDING')}>
            <RotateCcw size={16} /> Reopen
          </button>
        </div>
      )}
    </div>
  )
}
