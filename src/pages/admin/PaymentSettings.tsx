import { QrCode, Upload } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import SaveBar from '../../components/SaveBar'
import { ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import { useSaver } from '../../hooks/useSaver'
import type { PaymentInfo } from '../../types'

const MAX_QR_BYTES = 2 * 1024 * 1024
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/

/** Deposit details (UPI QR + bank account) shown to every client on their Deposit page. */
export default function PaymentSettings() {
  const { data, error, loading, reload } = useAsync(() => api.payment.get())

  return (
    <div className="page">
      <PageHeader title="Deposit Details" subtitle="UPI QR and bank account shown to every client on the Deposit page" />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <ErrorBox message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <PaymentForm initial={data} />
      )}
    </div>
  )
}

function PaymentForm({ initial }: { initial: PaymentInfo }) {
  const [current, setCurrent] = useState(initial)
  const [upiId, setUpiId] = useState(initial.upiId)
  const [bankName, setBankName] = useState(initial.bankName)
  const [accountHolderName, setAccountHolderName] = useState(initial.accountHolderName)
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber)
  const [ifscCode, setIfscCode] = useState(initial.ifscCode)
  const [note, setNote] = useState(initial.note)
  const [file, setFile] = useState<File | null>(null)
  const { saving, status, setStatus, run } = useSaver()

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  function handleFile(f: File | undefined) {
    setStatus(null)
    if (!f) return
    if (!f.type.startsWith('image/')) return setStatus({ ok: false, text: 'Please choose an image file' })
    if (f.size > MAX_QR_BYTES) return setStatus({ ok: false, text: 'Image must be under 2 MB' })
    setFile(f)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const ifsc = ifscCode.trim().toUpperCase()
    if (ifsc && !IFSC_RE.test(ifsc)) return setStatus({ ok: false, text: 'Enter a valid 11-character IFSC code (e.g. HDFC0001234)' })

    const saved = await run(() =>
      api.admin.updatePayment({
        upiId: upiId.trim(),
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.replace(/\s+/g, ''),
        ifscCode: ifsc,
        note,
        qrImage: file ?? undefined,
      }),
    )
    if (saved) {
      setCurrent(saved)
      setIfscCode(saved.ifscCode)
      setAccountNumber(saved.accountNumber)
      setFile(null)
    }
  }

  const shown = preview ?? current.qrImageUrl

  return (
    <form className="stack" onSubmit={handleSave}>
      <section className="panel">
        <div className="panel-head">
          <h2>UPI QR code</h2>
          <span className="muted small">Same QR for all clients</span>
        </div>
        <div className="qr-editor">
          <div className="qr-frame qr-frame-sm">
            {shown ? <img src={shown} alt="UPI QR preview" /> : <div className="qr-empty"><QrCode size={40} /><span>No QR yet</span></div>}
          </div>
          <div className="qr-editor-side">
            <label
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFile(e.dataTransfer.files[0])
              }}
            >
              <Upload size={22} />
              <strong>{current.qrImageUrl ? 'Replace QR image' : 'Upload QR image'}</strong>
              <span className="muted small">Click or drag & drop · PNG/JPG up to 2 MB</span>
              <input type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            {file && <span className="chip chip-warn">New image selected, not saved yet</span>}
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>UPI ID (optional)</span>
            <input className="input" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@bank" maxLength={100} />
            <span className="hint">Shown under the QR with a copy button.</span>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Bank transfer</h2>
          <span className="muted small">Optional · for NEFT / IMPS / RTGS deposits</span>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Bank name</span>
            <input className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" maxLength={100} />
          </label>
          <label className="field">
            <span>Account holder name</span>
            <input className="input" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} placeholder="e.g. AngelFx Capital Pvt Ltd" maxLength={150} />
          </label>
          <label className="field">
            <span>Account number</span>
            <input className="input mono" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 50100123456789" inputMode="numeric" maxLength={34} />
          </label>
          <label className="field">
            <span>IFSC code</span>
            <input className="input mono" value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())} placeholder="e.g. HDFC0001234" maxLength={11} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="form-grid">
          <label className="field full">
            <span>Note for clients</span>
            <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Share the payment screenshot on WhatsApp after paying" maxLength={500} />
          </label>
        </div>
      </section>

      <SaveBar saving={saving} status={status} label="Save deposit details" />
    </form>
  )
}
