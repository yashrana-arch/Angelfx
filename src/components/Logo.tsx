export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="vx-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb547" />
          <stop offset="1" stopColor="#ff7a1a" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#vx-g)" />
      <rect x="9" y="22" width="5" height="9" rx="1.5" fill="#0b1220" opacity=".85" />
      <rect x="17.5" y="17" width="5" height="14" rx="1.5" fill="#0b1220" opacity=".85" />
      <rect x="26" y="12" width="5" height="19" rx="1.5" fill="#0b1220" opacity=".85" />
      <path d="M8 19 L17 12 L23 15 L32 7" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-text">AngelFx</span>
    </span>
  )
}
