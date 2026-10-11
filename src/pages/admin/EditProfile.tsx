import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import SaveBar from '../../components/SaveBar'
import { useSaver } from '../../hooks/useSaver'
import type { ClientUpdate } from '../../types'
import { useClient } from './ClientDetail'

export default function EditProfile() {
  const { user, setUser } = useClient()
  const [form, setForm] = useState<ClientUpdate>({
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    clientCode: user.clientCode ?? '',
    verified: !!user.verified,
    password: '',
  })
  const { saving, status, run } = useSaver()

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const payload: ClientUpdate = { ...form, clientCode: form.clientCode?.trim().toUpperCase(), password: form.password || undefined }
    const saved = await run(() => api.admin.updateUser(user.id, payload))
    if (saved) {
      setUser(saved)
      setForm((f) => ({ ...f, password: '' }))
    }
  }

  const set = (k: keyof ClientUpdate) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <form className="stack" onSubmit={handleSave}>
      <section className="panel">
        <div className="panel-head">
          <h2>Account details</h2>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Full name</span>
            <input className="input" value={form.name} onChange={set('name')} required />
          </label>
          <label className="field">
            <span>User ID</span>
            <input className="input mono" value={form.clientCode} onChange={set('clientCode')} />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </label>
          <div className="field full">
            <span>Verification</span>
            <label className="switch-row">
              <input type="checkbox" className="switch" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
              <span>{form.verified ? 'Verified (client sees a “Verified” badge)' : 'Pending verification'}</span>
            </label>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Reset password</h2>
          <span className="muted small">Leave empty to keep the current password</span>
        </div>
        <label className="field">
          <span>New password</span>
          <input className="input" type="text" value={form.password} onChange={set('password')} minLength={6} placeholder="••••••" />
        </label>
      </section>

      <SaveBar saving={saving} status={status} />
    </form>
  )
}
