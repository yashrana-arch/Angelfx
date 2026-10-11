const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const num = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const int = new Intl.NumberFormat('en-IN')

export const formatINR = (n: number) => inr.format(n)
export const formatNum = (n: number) => num.format(n)
export const formatInt = (n: number) => int.format(n)

/** "+1.30%" / "-0.42%" */
export const formatPct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
/** "+288.65" / "-12.00" */
export const formatSigned = (n: number) => `${n > 0 ? '+' : ''}${num.format(n)}`

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

export const pnlClass = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat')

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

export const errorMessage = (e: unknown, fallback = 'Something went wrong') =>
  e instanceof Error ? e.message : fallback

/** Client-side id for rows the admin adds before saving. */
export const tempId = () => `new_${Math.random().toString(36).slice(2, 9)}`
