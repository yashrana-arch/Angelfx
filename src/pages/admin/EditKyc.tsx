import { FileText, Pencil, ShieldCheck, ShieldX, Undo2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { KycDetailsView, KycSectionFields } from '../../components/Kyc'
import { emptyKyc, KYC_SECTIONS, kycInputOf } from '../../utils/kyc'
import SaveBar from '../../components/SaveBar'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { Kyc, KycInput, KycStatus } from '../../types'
import { formatDateTime } from '../../utils/format'
import { kycBadge } from '../../utils/status'
import { useClient } from './ClientDetail'

export default function EditKyc() {
  const { user } = useClient()
  const { data: kyc, setData, error, loading, reload } = useAsync(() => api.admin.getKyc(user.id), [user.id])
  const [editing, setEditing] = useState(false)

  if (loading) return <Loading rows={3} />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  if (!kyc && !editing) {
    return (
      <div className="panel">
        <EmptyState
          icon={<FileText size={28} />}
          title="No KYC submitted yet"
          text="The client can fill this in from their profile. You can also enter the details on their behalf."
          action={
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Fill in KYC
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="stack">
      {kyc && <ReviewPanel kyc={kyc} onChange={setData} />}
      {editing || !kyc ? (
        <KycEditForm
          initial={kyc ? kycInputOf(kyc) : emptyKyc(user)}
          onCancel={() => setEditing(false)}
          onSaved={(k) => {
            setData(k)
            setEditing(false)
          }}
        />
      ) : (
        <>
          <div className="section-head">
            <h2>Submitted details</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Edit details
            </button>
          </div>
          <KycDetailsView kyc={kyc} />
        </>
      )}
    </div>
  )
}

function ReviewPanel({ kyc, onChange }: { kyc: Kyc; onChange: (k: Kyc) => void }) {
  const { user, setUser } = useClient()
  const [note, setNote] = useState(kyc.adminNote)
  const { saving, status, run } = useSaver()
  const badge = kycBadge(kyc.status)

  async function decide(next: KycStatus) {
    if (next === 'REJECTED' && !note.trim() && !window.confirm('Reject without a note? The client won’t know what to fix.')) return
    const saved = await run(() => api.admin.setKycStatus(user.id, next, note), next === 'APPROVED' ? 'KYC approved, client marked verified' : next === 'REJECTED' ? 'KYC rejected' : 'Moved back to review')
    if (saved) {
      onChange(saved)
      setUser({
        ...user,
        kycStatus: saved.status,
        verified: saved.status === 'APPROVED' ? true : saved.status === 'REJECTED' ? false : user.verified,
      })
    }
  }

  return (
    <section className="panel kyc-review">
      <div className="panel-head">
        <h2>Verification</h2>
        <span className={`chip ${badge.chip}`}>{badge.label}</span>
      </div>
      <p className="muted small">
        Submitted {formatDateTime(kyc.submittedAt)}
        {kyc.reviewedAt && ` · Reviewed ${formatDateTime(kyc.reviewedAt)}`}
      </p>
      <label className="field">
        <span>Note to client</span>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Shown to the client, e.g. what needs correcting" />
      </label>
      <div className="kyc-review-actions">
        {status && <span className={status.ok ? 'up' : 'down'}>{status.text}</span>}
        {kyc.status !== 'SUBMITTED' && (
          <button className="btn btn-ghost" onClick={() => decide('SUBMITTED')} disabled={saving}>
            <Undo2 size={16} /> Back to review
          </button>
        )}
        <button className="btn btn-danger-soft" onClick={() => decide('REJECTED')} disabled={saving}>
          <ShieldX size={16} /> Reject
        </button>
        <button className="btn btn-success" onClick={() => decide('APPROVED')} disabled={saving}>
          <ShieldCheck size={16} /> Approve
        </button>
      </div>
      <span className="hint">Approving marks the client as verified; rejecting removes the verified badge.</span>
    </section>
  )
}

function KycEditForm({ initial, onCancel, onSaved }: { initial: KycInput; onCancel: () => void; onSaved: (k: Kyc) => void }) {
  const { user, setUser } = useClient()
  const [form, setForm] = useState(initial)
  const { saving, status, run } = useSaver()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const saved = await run(() => api.admin.saveKyc(user.id, form))
    if (saved) {
      onSaved(saved)
      setUser({ ...user, kycStatus: saved.status })
    }
  }

  return (
    <form className="stack" onSubmit={handleSave}>
      <div className="section-head">
        <h2>Edit details</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {KYC_SECTIONS.map(({ key, title, hint, icon: Icon }) => (
        <section key={key} className="panel">
          <div className="kyc-card-head">
            <span className="kyc-card-icon">
              <Icon size={18} />
            </span>
            <div>
              <h2>{title}</h2>
              <span className="muted small">{hint}</span>
            </div>
          </div>
          <KycSectionFields section={key} value={form} onChange={setForm} />
        </section>
      ))}
      <SaveBar saving={saving} status={status} label="Save KYC" />
    </form>
  )
}
