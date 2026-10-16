import { Eye, EyeOff } from 'lucide-react'
import { useState, type ChangeEvent, type ReactNode } from 'react'
import type { KycInput } from '../types'
import { formatAadhaar, INDIAN_STATES, KYC_SECTIONS, type KycSectionKey } from '../utils/kyc'

const mask = (v: string, keep = 4) => (v.length <= keep ? v : '•'.repeat(v.length - keep) + v.slice(-keep))
const maskAadhaar = (v: string) => `•••• •••• ${v.replace(/\D/g, '').slice(-4)}`

/** Latest date of birth that makes someone 18 today. */
const maxDob = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().slice(0, 10)
}

/** The inputs for one KYC section. Native `pattern`s give instant feedback; the API re-checks everything. */
export function KycSectionFields({
  section,
  value,
  onChange,
  autoFocus,
}: {
  section: KycSectionKey
  value: KycInput
  onChange: (v: KycInput) => void
  autoFocus?: boolean
}) {
  const set =
    (k: keyof KycInput, fmt: (s: string) => string = (s) => s) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [k]: fmt(e.target.value) })
  const upper = (s: string) => s.toUpperCase()

  switch (section) {
    case 'personal':
      return (
        <div className="form-grid">
          <label className="field">
            <span>First name</span>
            <input className="input" value={value.firstName} onChange={set('firstName')} maxLength={75} autoComplete="given-name" required autoFocus={autoFocus} />
          </label>
          <label className="field">
            <span>Last name</span>
            <input className="input" value={value.lastName} onChange={set('lastName')} maxLength={75} autoComplete="family-name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={value.email} onChange={set('email')} maxLength={256} autoComplete="email" required />
          </label>
          <label className="field">
            <span>Phone number</span>
            <input className="input" type="tel" value={value.phone} onChange={set('phone')} placeholder="+91 98765 43210" pattern="\+?[0-9][0-9 \-]{6,18}" title="Enter a valid phone number" maxLength={20} autoComplete="tel" required />
          </label>
          <label className="field">
            <span>Date of birth</span>
            <input className="input" type="date" value={value.dateOfBirth} onChange={set('dateOfBirth')} min="1900-01-01" max={maxDob()} title="You must be at least 18 years old" autoComplete="bday" required />
          </label>
        </div>
      )
    case 'address':
      return (
        <div className="form-grid">
          <label className="field full">
            <span>Address line</span>
            <input className="input" value={value.addressLine} onChange={set('addressLine')} placeholder="House no., street, area" maxLength={250} autoComplete="street-address" required autoFocus={autoFocus} />
          </label>
          <label className="field">
            <span>City</span>
            <input className="input" value={value.city} onChange={set('city')} maxLength={100} autoComplete="address-level2" required />
          </label>
          <label className="field">
            <span>State</span>
            <input className="input" value={value.state} onChange={set('state')} list="kyc-states" placeholder="Start typing…" maxLength={100} autoComplete="address-level1" required />
            <datalist id="kyc-states">
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>Nationality</span>
            <input className="input" value={value.nationality} onChange={set('nationality')} maxLength={60} required />
          </label>
        </div>
      )
    case 'bank':
      return (
        <div className="form-grid">
          <label className="field">
            <span>Bank name</span>
            <input className="input" value={value.bankName} onChange={set('bankName')} placeholder="e.g. HDFC Bank" maxLength={100} required autoFocus={autoFocus} />
          </label>
          <label className="field">
            <span>Account holder name</span>
            <input className="input" value={value.accountHolderName} onChange={set('accountHolderName')} maxLength={150} required />
          </label>
          <label className="field">
            <span>Account number</span>
            <input className="input mono" value={value.accountNumber} onChange={set('accountNumber')} inputMode="numeric" pattern="[0-9 ]{6,22}" title="6 to 18 digits" maxLength={22} required />
          </label>
          <label className="field">
            <span>IFSC code</span>
            <input className="input mono" value={value.ifscCode} onChange={set('ifscCode', upper)} placeholder="HDFC0001234" pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" title="11 characters, e.g. HDFC0001234" maxLength={11} required />
          </label>
        </div>
      )
    case 'documents':
      return (
        <div className="form-grid">
          <label className="field">
            <span>Aadhaar number</span>
            <input className="input mono" value={value.aadhaarNumber} onChange={set('aadhaarNumber', formatAadhaar)} placeholder="1234 5678 9012" inputMode="numeric" pattern="[2-9][0-9]{3} ?[0-9]{4} ?[0-9]{4}" title="12-digit Aadhaar number" maxLength={14} required autoFocus={autoFocus} />
          </label>
          <label className="field">
            <span>PAN</span>
            <input className="input mono" value={value.panNumber} onChange={set('panNumber', upper)} placeholder="ABCDE1234F" pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" title="10 characters, e.g. ABCDE1234F" maxLength={10} required />
          </label>
        </div>
      )
  }
}

/** Read-only KYC details as four cards. Aadhaar and account number are masked until revealed. */
export function KycDetailsView({ kyc }: { kyc: KycInput }) {
  const dob = kyc.dateOfBirth
    ? new Date(`${kyc.dateOfBirth}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const rows: Record<KycSectionKey, [string, ReactNode][]> = {
    personal: [
      ['Name', `${kyc.firstName} ${kyc.lastName}`],
      ['Email', kyc.email],
      ['Phone', kyc.phone],
      ['Date of birth', dob],
    ],
    address: [
      ['Address', kyc.addressLine],
      ['City', kyc.city],
      ['State', kyc.state],
      ['Nationality', kyc.nationality],
    ],
    bank: [
      ['Bank', kyc.bankName],
      ['Account holder', kyc.accountHolderName],
      ['Account number', <Secret value={kyc.accountNumber} masked={mask(kyc.accountNumber)} />],
      ['IFSC', <span className="mono">{kyc.ifscCode}</span>],
    ],
    documents: [
      ['Aadhaar', <Secret value={formatAadhaar(kyc.aadhaarNumber)} masked={maskAadhaar(kyc.aadhaarNumber)} />],
      ['PAN', <Secret value={kyc.panNumber} masked={mask(kyc.panNumber, 3)} />],
    ],
  }

  return (
    <div className="kyc-cards">
      {KYC_SECTIONS.map(({ key, title, icon: Icon }) => (
        <section key={key} className="kyc-card">
          <div className="kyc-card-head">
            <span className="kyc-card-icon">
              <Icon size={18} />
            </span>
            <h3>{title}</h3>
          </div>
          <dl>
            {rows[key].map(([label, val]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{val || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

function Secret({ value, masked }: { value: string; masked: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="kyc-secret">
      <span className="mono">{show ? value : masked}</span>
      <button type="button" className="copy-btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </span>
  )
}
