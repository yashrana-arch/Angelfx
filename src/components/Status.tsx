import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { LogoMark } from './Logo'

export function FullScreenLoader() {
  return (
    <div className="fullscreen-loader">
      <div className="pulse">
        <LogoMark size={48} />
      </div>
    </div>
  )
}

/** Skeleton placeholder blocks while a page loads. */
export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-error">
      <CircleAlert size={18} />
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-ghost btn-sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {text && <div className="empty-text">{text}</div>}
      {action}
    </div>
  )
}
