import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User as UserIcon, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/paths'
import Logo from '../components/Logo'
import Sparkline from '../components/Sparkline'
import { errorMessage } from '../utils/format'
import '../styles/landing.css'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // While submitting, handleSubmit does the redirect (to KYC), so don't race it.
  if (user && !submitting) return <Navigate to={homeFor(user.role)} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')

    setSubmitting(true)
    try {
      const created = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      })
      // New clients go straight to KYC; they can skip it and finish later from their profile.
      navigate(created.role === 'client' ? '/client/kyc' : homeFor(created.role), { replace: true, state: { welcome: true } })
    } catch (err) {
      setError(errorMessage(err, 'Could not create account'))
      setSubmitting(false)
    }
  }

  return (
    <div className="auth">
      <aside className="auth-side">
        <div className="lp-glow lp-glow-1" />
        <Link to="/">
          <Logo />
        </Link>
        <div className="auth-side-copy">
          <h2>
            Open your account.
            <br />
            <span className="gradient-text">Start in under a minute.</span>
          </h2>
          <p>Watchlist, trades, portfolio and instant UPI deposits, all in one place.</p>
        </div>
        <div className="auth-side-card">
          <div className="row-between">
            <span className="muted small">NIFTY 50</span>
            <span className="up small">+1.30%</span>
          </div>
          <strong>22,520.45</strong>
          <Sparkline seed="register" trend={1} color="#ff9f2e" height={64} />
        </div>
      </aside>

      <main className="auth-main">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-logo">
            <Logo size={36} />
          </div>
          <h1>Create account</h1>
          <p className="muted">Fill in your details to get started.</p>

          <label className="field">
            <span>Full name</span>
            <div className="input-icon">
              <UserIcon size={18} />
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                maxLength={150}
                required
                autoFocus
              />
            </div>
          </label>

          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <Mail size={18} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={256}
                required
              />
            </div>
          </label>

          <label className="field">
            <span>Phone (optional)</span>
            <div className="input-icon">
              <Phone size={18} />
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                maxLength={20}
              />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-icon">
              <Lock size={18} />
              <input
                className="input"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button type="button" className="input-action" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="field">
            <span>Confirm password</span>
            <div className="input-icon">
              <Lock size={18} />
              <input
                className="input"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : <UserPlus size={18} />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="muted small center">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  )
}
