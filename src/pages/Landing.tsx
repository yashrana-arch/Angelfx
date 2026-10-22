import {
  ArrowRight,
  BookOpen,
  Briefcase,
  ChartCandlestick,
  LogIn,
  Menu,
  QrCode,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { homeFor } from '../auth/paths'
import Logo from '../components/Logo'
import Sparkline from '../components/Sparkline'
import { formatNum, formatPct, pnlClass } from '../utils/format'
import '../styles/landing.css'

const TICKER = [
  { s: 'NIFTY 50', p: 22520.45, c: 1.3 },
  { s: 'BANKNIFTY', p: 55256.65, c: 1.36 },
  { s: 'SENSEX', p: 72472.33, c: -1.2 },
  { s: 'RELIANCE', p: 2945.1, c: 0.84 },
  { s: 'TCS', p: 4012.55, c: -0.42 },
  { s: 'HDFCBANK', p: 707.25, c: -2.17 },
  { s: 'EICHERMOT', p: 7050, c: 4.17 },
  { s: 'HCLTECH', p: 1216.7, c: 3.38 },
  { s: 'DRREDDY', p: 1197, c: 1.44 },
  { s: 'GRASIM', p: 2890, c: -1.16 },
]

const FEATURES = [
  { icon: ChartCandlestick, title: 'Live market watch', text: 'Track Nifty, Bank Nifty, Sensex and your favourite stocks with clean, glanceable cards.' },
  { icon: Briefcase, title: 'Portfolio at a glance', text: 'Ledger balance, margin, M2M and today’s P&L, all on one screen.' },
  { icon: Zap, title: 'Trade tracking', text: 'Pending, active and closed orders, neatly organised with entry, exit and P&L.' },
  { icon: QrCode, title: 'Instant UPI deposits', text: 'Scan a QR with GPay, PhonePe or Paytm and top up your wallet in seconds.' },
  { icon: BookOpen, title: 'Transparent ledger', text: 'Every credit and debit with a running balance. No surprises.' },
  { icon: ShieldCheck, title: 'Secure by design', text: 'Token-based sessions and role-based access keep your account protected.' },
]

const STEPS = [
  { n: '01', title: 'Create your account', text: 'Sign up in minutes to open your trading account.' },
  { n: '02', title: 'Fund via UPI', text: 'Open Deposit, scan the QR and pay from any UPI app.' },
  { n: '03', title: 'Track & grow', text: 'Follow the markets, your trades and your P&L in real time.' },
]

export default function Landing() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const cta = user ? (
    <Link to={homeFor(user.role)} className="btn btn-primary">
      Open dashboard <ArrowRight size={18} />
    </Link>
  ) : (
    <Link to="/login" className="btn btn-primary">
      <LogIn size={18} /> Login
    </Link>
  )

  const links = (
    <>
      <a href="#markets" onClick={() => setMenuOpen(false)}>Markets</a>
      <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
      <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
    </>
  )

  return (
    <div className="landing">
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-header-inner">
          <Link to="/" aria-label="AngelFx home">
            <Logo />
          </Link>
          <nav className="lp-nav">{links}</nav>
          <div className="lp-header-cta">{cta}</div>
          <button className="icon-btn lp-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`lp-drawer-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`lp-drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="lp-drawer-head">
          <Logo size={28} />
          <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="lp-drawer-nav">{links}</nav>
        <div className="lp-drawer-cta">
          {user ? (
            <Link to={homeFor(user.role)} className="btn btn-primary btn-block">
              Open dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-block">
              <LogIn size={18} /> Login
            </Link>
          )}
          <p className="muted small center">Clients and admins use the same login.</p>
        </div>
      </aside>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-glow lp-glow-1" />
        <div className="lp-glow lp-glow-2" />
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-pill">
              <span className="live-dot" /> Live markets · NSE &amp; BSE
            </span>
            <h1>
              Trade smarter.
              <br />
              <span className="gradient-text">Grow faster.</span>
            </h1>
            <p className="lp-lead">
              AngelFx puts your watchlist, trades, portfolio and wallet in one fast, beautiful app built for Indian
              markets.
            </p>
            <div className="lp-hero-actions">
              {cta}
              <a href="#features" className="btn btn-ghost">
                Explore features
              </a>
            </div>
            <div className="lp-trust">
              <div>
                <strong>1s</strong>
                <span>data refresh</span>
              </div>
              <div>
                <strong>UPI</strong>
                <span>instant deposits</span>
              </div>
              <div>
                <strong>24×7</strong>
                <span>account access</span>
              </div>
            </div>
          </div>

          <PhoneMock />
        </div>
      </section>

      {/* Ticker */}
      <section id="markets" className="lp-ticker" aria-label="Market ticker">
        <div className="lp-ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="lp-tick">
              <b>{t.s}</b>
              <span>{formatNum(t.p)}</span>
              <span className={pnlClass(t.c)}>
                {t.c >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {formatPct(t.c)}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="eyebrow">Features</span>
            <h2>Everything you need to stay ahead</h2>
            <p className="muted">One app for watching markets, managing trades and moving money.</p>
          </div>
          <div className="lp-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="lp-feature">
                <div className="lp-feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <span className="eyebrow">How it works</span>
            <h2>Start trading in three steps</h2>
          </div>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="lp-step">
                <span className="lp-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-cta">
            <div>
              <h2>Ready to take control of your trades?</h2>
              <p>Log in, or <Link to="/register">create your account</Link> in under a minute.</p>
            </div>
            {cta}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <Logo size={26} />
          <p className="muted small">
            © {new Date().getFullYear()} AngelFx. Investments in securities are subject to market risks. Read all related
            documents carefully before investing.
          </p>
        </div>
      </footer>
    </div>
  )
}

function PhoneMock() {
  return (
    <div className="lp-phone-wrap" aria-hidden="true">
      <div className="lp-phone">
        <div className="lp-phone-notch" />
        <div className="lp-phone-screen">
          <div className="pm-head">
            <span className="muted small">Portfolio</span>
            <Smartphone size={14} className="muted" />
          </div>
          <div className="pm-balance">
            <span className="muted small">Ledger balance</span>
            <strong>₹50,000.00</strong>
            <span className="up small">
              <TrendingUp size={12} /> +₹2,365.50 today
            </span>
          </div>
          <div className="pm-chart">
            <Sparkline seed="hero" trend={1} color="#ff9f2e" height={70} />
          </div>
          {[
            { s: 'NIFTY 50', p: '22,520.45', c: 1.3 },
            { s: 'RELIANCE', p: '2,945.10', c: 0.84 },
            { s: 'HDFCBANK', p: '707.25', c: -2.17 },
          ].map((r) => (
            <div key={r.s} className="pm-row">
              <span>{r.s}</span>
              <span className="pm-row-right">
                <span>{r.p}</span>
                <span className={`chip chip-${pnlClass(r.c)}`}>{formatPct(r.c)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-float lp-float-1">
        <QrCode size={18} />
        <div>
          <strong>Deposit received</strong>
          <span className="muted small">₹10,000 via UPI</span>
        </div>
      </div>
      <div className="lp-float lp-float-2">
        <TrendingUp size={18} className="up" />
        <div>
          <strong>Target hit</strong>
          <span className="muted small">NIFTY CE +24.7%</span>
        </div>
      </div>
    </div>
  )
}
