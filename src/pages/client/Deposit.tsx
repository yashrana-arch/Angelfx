import { Check, Copy, ImagePlus, Info, QrCode, Receipt, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import ProofImage from '../../components/ProofImage'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'
import type { PaymentProof } from '../../types'
import { errorMessage, formatDateTime, formatINR } from '../../utils/format'
import { compressImage, formatBytes } from '../../utils/image'
import { proofChip, proofLabel } from '../../utils/status'

/** Server limit, checked after compression. */
const MAX_BYTES = 5 * 1024 * 1024
/** Bigger originals (e.g. camera photos) are accepted as long as they compress under MAX_BYTES. */
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024

export default function Deposit() {
  const { data: payment, error, loading, reload } = useAsync(() => api.payment.get())
  const proofs = useAsync(() => api.client.getPaymentProofs())
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500)
  }

  const bankRows = payment
    ? [
        { key: 'bank', label: 'Bank name', value: payment.bankName },
        { key: 'holder', label: 'Account holder', value: payment.accountHolderName },
        { key: 'account', label: 'Account number', value: payment.accountNumber, mono: true },
        { key: 'ifsc', label: 'IFSC code', value: payment.ifscCode, mono: true },
      ].filter((r) => r.value)
    : []
  const hasBank = !!payment?.accountNumber

  return (
    <div className="page page-narrow">
      <PageHeader title="Deposit" subtitle="Add funds with UPI or bank transfer" back="/client/profile" />

      {loading ? (
        <Loading rows={3} />
      ) : error || !payment ? (
        <ErrorBox message={error ?? 'No data'} onRetry={reload} />
      ) : !payment.qrImageUrl && !hasBank ? (
        <EmptyState icon={<QrCode size={30} />} title="Deposit details not available yet" text="Please contact your account manager to enable deposits." />
      ) : (
        <>
          {payment.qrImageUrl && (
            <div className="qr-card">
              <div className="qr-frame">
                <img src={payment.qrImageUrl} alt="UPI payment QR code" />
              </div>
              <div className="upi-apps muted small">GPay · PhonePe · Paytm · BHIM</div>
              {payment.upiId && (
                <button className="upi-pill" onClick={() => copy('upi', payment.upiId)}>
                  <span className="muted small">UPI ID</span>
                  <strong>{payment.upiId}</strong>
                  {copied === 'upi' ? <Check size={16} className="up" /> : <Copy size={16} />}
                </button>
              )}
            </div>
          )}

          {hasBank && (
            <section className="bank-card">
              <h2>Bank transfer (NEFT / IMPS / RTGS)</h2>
              {bankRows.map((r) => (
                <div className="bank-row" key={r.key}>
                  <div>
                    <span className="muted small">{r.label}</span>
                    <strong className={r.mono ? 'mono' : undefined}>{r.value}</strong>
                  </div>
                  <button type="button" className="copy-btn" onClick={() => copy(r.key, r.value)} aria-label={`Copy ${r.label}`}>
                    {copied === r.key ? <Check size={16} className="up" /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </section>
          )}

          <ol className="steps">
            <li>{payment.qrImageUrl ? 'Scan the QR with any UPI app' : 'Add the bank account above as a beneficiary'}{payment.qrImageUrl && hasBank ? ', or transfer to the bank account above.' : '.'}</li>
            <li>Enter the amount you want to add and complete the payment.</li>
            <li>Upload a screenshot of the successful payment below.</li>
            <li>Funds reflect in your ledger once verified by the team.</li>
          </ol>

          {payment.note && (
            <div className="alert alert-info">
              <Info size={18} /> <span>{payment.note}</span>
            </div>
          )}

          <UploadProof onUploaded={(p) => proofs.setData([p, ...(proofs.data ?? [])])} />
        </>
      )}

      {(proofs.data?.length ?? 0) > 0 || proofs.error ? (
        <>
          <div className="section-head">
            <h2>Your payment screenshots</h2>
          </div>
          {proofs.error ? (
            <ErrorBox message={proofs.error} onRetry={proofs.reload} />
          ) : (
            <div className="list-panel">
              {proofs.data!.map((p) => (
                <ProofRow key={p.id} p={p} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

function UploadProof({ onUploaded }: { onUploaded: (p: PaymentProof) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  // The (compressed) image to upload, its original size, and an object URL for the local preview.
  const [chosen, setChosen] = useState<{ file: File; originalSize: number; preview: string } | null>(null)
  const file = chosen?.file ?? null
  const preview = chosen?.preview ?? null
  const [compressing, setCompressing] = useState(false)
  const pickId = useRef(0) // ignores a slow compression if another image was picked meanwhile
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  // Free the preview URL when it's replaced or the form unmounts.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  async function pick(f: File | null | undefined) {
    if (!f) return
    setStatus(null)
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) return setStatus({ ok: false, text: 'Please choose a PNG, JPG, WEBP or GIF image' })
    if (f.size > MAX_ORIGINAL_BYTES) return setStatus({ ok: false, text: 'Image is too large. Please choose one under 25 MB.' })

    const id = ++pickId.current
    setCompressing(true)
    const small = await compressImage(f)
    if (id !== pickId.current) return
    setCompressing(false)

    if (small.size > MAX_BYTES) return setStatus({ ok: false, text: 'Image is still over 5 MB after compressing. Please choose a smaller one.' })
    setChosen({ file: small, originalSize: f.size, preview: URL.createObjectURL(small) })
  }

  function clear() {
    pickId.current++
    setCompressing(false)
    setChosen(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    pick(e.dataTransfer.files[0])
  }

  // Lets people paste a screenshot straight from the clipboard.
  function onPaste(e: ClipboardEvent) {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'))
    if (item) {
      e.preventDefault()
      pick(item.getAsFile())
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!file) return setStatus({ ok: false, text: 'Please choose a screenshot to upload' })
    setSaving(true)
    setStatus(null)
    try {
      const proof = await api.client.uploadPaymentProof({
        image: file,
        amount: amount ? Number(amount) : undefined,
        reference: reference.trim() || undefined,
      })
      onUploaded(proof)
      clear()
      setAmount('')
      setReference('')
      setStatus({ ok: true, text: 'Screenshot uploaded. We’ll verify it and credit your account.' })
    } catch (err) {
      setStatus({ ok: false, text: errorMessage(err, 'Upload failed') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel form-stack proof-upload" onSubmit={handleSubmit} onPaste={onPaste}>
      <div className="proof-upload-head">
        <span className="kyc-card-icon">
          <Receipt size={18} />
        </span>
        <div>
          <h2>Paid already? Upload the screenshot</h2>
          <p className="muted small">A clear screenshot showing the amount and transaction ID helps us verify faster.</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => pick(e.target.files?.[0])} />

      {preview ? (
        <div className="proof-preview">
          <img src={preview} alt="Selected screenshot" />
          <div className="proof-preview-info">
            <strong>{file!.name}</strong>
            <span className="muted small">
              {chosen!.originalSize > file!.size ? (
                <>
                  {formatBytes(chosen!.originalSize)} → <span className="up">{formatBytes(file!.size)}</span> · compressed
                </>
              ) : (
                formatBytes(file!.size)
              )}
            </span>
            <div className="row-gap">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
                Change
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
                <X size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`proof-drop ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={compressing}
        >
          <span className="proof-drop-icon">{compressing ? <span className="spinner" /> : <ImagePlus size={26} />}</span>
          <strong>{compressing ? 'Optimizing image…' : 'Tap to choose a screenshot'}</strong>
          <span className="muted small">or drag &amp; drop / paste it here · PNG, JPG, WEBP · large images are compressed automatically</span>
        </button>
      )}

      <div className="form-grid">
        <label className="field">
          <span>Amount paid (₹, optional)</span>
          <input className="input" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </label>
        <label className="field">
          <span>UTR / transaction ID (optional)</span>
          <input className="input mono" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={50} placeholder="e.g. 412345678901" />
        </label>
      </div>

      {status && <div className={`alert ${status.ok ? 'alert-success' : 'alert-error'}`}>{status.text}</div>}

      <button className="btn btn-primary btn-block" disabled={saving || compressing || !file}>
        {saving ? <span className="spinner" /> : <Upload size={18} />}
        {saving ? 'Uploading…' : 'Submit screenshot'}
      </button>
    </form>
  )
}

function ProofRow({ p }: { p: PaymentProof }) {
  return (
    <div className="list-row proof-row">
      <ProofImage load={() => api.client.getPaymentProofImage(p.id)} alt={p.fileName} />
      <div className="proof-info">
        <strong>{p.amount != null ? formatINR(p.amount) : 'Amount not entered'}</strong>
        <span className="muted small">
          {formatDateTime(p.createdAt)}
          {p.reference && (
            <>
              {' · '}
              <span className="mono">{p.reference}</span>
            </>
          )}
        </span>
        {p.adminNote && <span className="small">Note: {p.adminNote}</span>}
      </div>
      <span className={`chip ${proofChip[p.status]}`}>{proofLabel[p.status]}</span>
    </div>
  )
}
