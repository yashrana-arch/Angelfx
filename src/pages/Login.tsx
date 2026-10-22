import { ArrowLeft, Eye, EyeOff, Lock, LogIn, User as UserIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { USE_MOCK } from '../api'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/paths'
import Logo from '../components/Logo'
import Sparkline from '../components/Sparkline'
import { errorMessage } from '../utils/format'
import '../styles/landing.css'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={homeFor(user.role)} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedIn = await login(username.trim(), password)
      // Only honour the "from" redirect if it belongs to this user's area.
      const from = (location.state as { from?: string } | null)?.from
      const home = homeFor(loggedIn.role)
      navigate(from?.startsWith(home) ? from : home, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed'))
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
            Your markets.
            <br />
            <span className="gradient-text">Your money. One app.</span>
          </h2>
          <p>Watchlist, trades, portfolio and instant UPI deposits, all in one place.</p>
        </div>
        <div className="auth-side-card">
          <div className="row-between">
            <span className="muted small">NIFTY 50</span>
            <span className="up small">+1.30%</span>
          </div>
          <strong>22,520.45</strong>
          <Sparkline seed="login" trend={1} color="#ff9f2e" height={64} />
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
          <h1>Welcome back</h1>
          <p className="muted">Sign in to continue.</p>

          <label className="field">
            <span>Email or User ID</span>
            <div className="input-icon">
              <UserIcon size={18} />
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@example.com or AD89898HH"
                autoComplete="username"
                required
                autoFocus
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
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="input-action" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : <LogIn size={18} />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="muted small center">
            Don’t have an account? <Link to="/register">Create one</Link>
          </p>

          {USE_MOCK && (
            <div className="mock-hint">
              <strong>Demo mode</strong>
              <button type="button" onClick={() => { setUsername('client@veltrex.com'); setPassword('client123') }}>
                Fill client login
              </button>
              <button type="button" onClick={() => { setUsername('admin@veltrex.com'); setPassword('admin123') }}>
                Fill admin login
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
