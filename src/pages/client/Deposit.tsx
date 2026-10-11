import { Check, Copy, Info, QrCode } from 'lucide-react'
import { useState } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { EmptyState, ErrorBox, Loading } from '../../components/Status'
import { useAsync } from '../../hooks/useAsync'

export default function Deposit() {
  const { data: payment, error, loading, reload } = useAsync(() => api.payment.get())
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
            <li>Funds reflect in your ledger once verified by the team.</li>
          </ol>

          {payment.note && (
            <div className="alert alert-info">
              <Info size={18} /> <span>{payment.note}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
