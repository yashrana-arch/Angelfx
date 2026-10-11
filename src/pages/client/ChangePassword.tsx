import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import PageHeader from '../../components/PageHeader'
import { errorMessage } from '../../utils/format'

export default function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (next !== confirm) return setStatus({ ok: false, text: 'New passwords do not match' })
    setSaving(true)
    setStatus(null)
    try {
      await api.client.changePassword(current, next)
      setCurrent('')
      setNext('')
      setConfirm('')
      setStatus({ ok: true, text: 'Password updated successfully' })
    } catch (err) {
      setStatus({ ok: false, text: errorMessage(err, 'Could not update password') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page page-narrow">
      <PageHeader title="Change password" back="/client/profile" />
      <form className="panel form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Current password</span>
          <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="field">
          <span>New password</span>
          <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={6} required />
        </label>
        {status && <div className={`alert ${status.ok ? 'alert-success' : 'alert-error'}`}>{status.text}</div>}
        <button className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
