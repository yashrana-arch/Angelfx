import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface Props {
  title: string
  subtitle?: ReactNode
  back?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, back, actions }: Props) {
  return (
    <div className="page-header">
      <div className="page-header-title">
        {back && (
          <Link to={back} className="icon-btn" aria-label="Back">
            <ChevronLeft size={20} />
          </Link>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="page-subtitle">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}
