import { ArrowLeft, ArrowRight, Check, Hourglass, Lock, PartyPopper, Pencil, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { api } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { KycDetailsView, KycSectionFields } from '../../components/Kyc'
import { emptyKyc, KYC_SECTIONS, kycInputOf } from '../../utils/kyc'
import PageHeader from '../../components/PageHeader'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { Kyc as KycData, KycInput } from '../../types'
import { errorMessage, formatDateTime } from '../../utils/format'

export default function Kyc() {
  const { user, refreshUser } = useAuth()
  const location = useLocation()
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome
  const { data: kyc, setData, error, loading, reload } = useAsync(() => api.client.getKyc())
  const [editing, setEditing] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)

  if (!user) return null
  if (loading) return <Loading rows={3} />
  if (error) return <ErrorBox message={error} onRetry={reload} />

  if (!kyc || editing) {
    return (
      <KycWizard
        initial={kyc ? kycInputOf(kyc) : emptyKyc(user)}
        welcome={!!welcome && !kyc}
        onCancel={kyc ? () => setEditing(false) : undefined}
        onSubmitted={(saved) => {
          setData(saved)
          setEditing(false)
          setJustSubmitted(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          refreshUser().catch(() => {})
        }}
      />
    )
  }

  return (
    <div className="page">
      <PageHeader title="KYC details" subtitle="Your verification details" back="/client/profile" />
      {justSubmitted && (
        <div className="alert alert-success">
          <Check size={18} />
          <span>Thanks! Your details were submitted. We’ll verify them shortly.</span>
        </div>
      )}
      <KycStatusCard kyc={kyc} onEdit={() => setEditing(true)} />
      <KycDetailsView kyc={kyc} />
    </div>
  )
}

function KycStatusCard({ kyc, onEdit }: { kyc: KycData; onEdit: () => void }) {
  const s = {
    APPROVED: { cls: 'approved', icon: ShieldCheck, title: 'You’re verified', text: 'Your KYC has been approved. Your details are now locked; contact support if anything changes.' },
    SUBMITTED: { cls: 'review', icon: Hourglass, title: 'Under review', text: 'We’re checking your details. This usually doesn’t take long. You can still edit them while you wait.' },
    REJECTED: { cls: 'rejected', icon: ShieldAlert, title: 'Changes needed', text: 'We couldn’t verify your details. Please correct them and submit again.' },
  }[kyc.status]
  const Icon = s.icon

  return (
    <div className={`kyc-status kyc-status-${s.cls}`}>
      <span className="kyc-status-icon">
        <Icon size={26} />
      </span>
      <div className="kyc-status-body">
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        {kyc.adminNote && (
          <p className="kyc-note">
            <strong>Note from our team:</strong> {kyc.adminNote}
          </p>
        )}
        <span className="muted small">
          Submitted {formatDateTime(kyc.submittedAt)}
          {kyc.reviewedAt && ` · Reviewed ${formatDateTime(kyc.reviewedAt)}`}
        </span>
      </div>
      {kyc.status === 'APPROVED' ? (
        <span className="chip chip-up">
          <Lock size={12} /> Locked
        </span>
      ) : (
        <button className="btn btn-ghost" onClick={onEdit}>
          <Pencil size={16} /> Edit details
        </button>
      )}
    </div>
  )
}

function KycWizard({
  initial,
  welcome,
  onCancel,
  onSubmitted,
}: {
  initial: KycInput
  welcome: boolean
  /** Shown when editing an existing KYC; otherwise the client gets "Skip for now". */
  onCancel?: () => void
  onSubmitted: (k: KycData) => void
}) {
  const [form, setForm] = useState(initial)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const section = KYC_SECTIONS[step]!
  const last = step === KYC_SECTIONS.length - 1
  const SectionIcon = section.icon

  async function handleNext(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!last) return setStep(step + 1)

    setSaving(true)
    try {
      onSubmitted(await api.client.submitKyc(form))
    } catch (ex) {
      setErr(errorMessage(ex, 'Could not submit your details'))
      setSaving(false)
    }
  }

  return (
    <div className="page page-kyc">
      <PageHeader
        title="Complete your KYC"
        subtitle="Takes about 2 minutes · 4 quick steps"
        actions={
          onCancel ? (
            <button className="btn btn-ghost btn-sm" onClick={onCancel}>
              Cancel
            </button>
          ) : (
            <Link to="/client" className="btn btn-ghost btn-sm">
              Skip for now
            </Link>
          )
        }
      />

      {welcome && (
        <div className="kyc-welcome">
          <PartyPopper size={22} />
          <div>
            <strong>Your account is ready!</strong>
            <span>One last step: verify your identity to get your account fully activated. You can also do this later from your profile.</span>
          </div>
        </div>
      )}

      <ol className="stepper" aria-label="KYC steps">
        {KYC_SECTIONS.map(({ key, short, icon: Icon }, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo'
          return (
            <li key={key} className={`stepper-item ${state}`}>
              <button type="button" className="stepper-dot" onClick={() => i < step && setStep(i)} disabled={i >= step} aria-current={i === step ? 'step' : undefined}>
                {state === 'done' ? <Check size={18} /> : <Icon size={18} />}
              </button>
              <span className="stepper-label">{short}</span>
            </li>
          )
        })}
      </ol>

      {/* key remounts the form per step so autoFocus and native validation apply to that step only */}
      <form key={section.key} className="panel kyc-step" onSubmit={handleNext}>
        <div className="kyc-step-head">
          <span className="kyc-card-icon kyc-card-icon-lg">
            <SectionIcon size={22} />
          </span>
          <div>
            <span className="eyebrow">
              Step {step + 1} of {KYC_SECTIONS.length}
            </span>
            <h2>{section.title}</h2>
            <p className="muted small">{section.hint}</p>
          </div>
        </div>

        <KycSectionFields section={section.key} value={form} onChange={setForm} autoFocus />

        {last && (
          <p className="kyc-consent muted small">
            <Lock size={14} /> Your document numbers are only visible to you and our verification team.
          </p>
        )}
        {err && <div className="alert alert-error">{err}</div>}

        <div className="kyc-step-actions">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft size={18} /> Back
            </button>
          ) : (
            <span />
          )}
          <button className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner" /> Submitting…
              </>
            ) : last ? (
              <>
                <ShieldCheck size={18} /> Submit for verification
              </>
            ) : (
              <>
                Continue <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
