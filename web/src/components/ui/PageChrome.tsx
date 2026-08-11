import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './ui.css'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-copy">
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="ui-page-header-actions">{actions}</div> : null}
    </header>
  )
}

export type StatItem = {
  id: string
  label: string
  value: string
  tone?: 'brand' | 'accent' | 'warn' | 'info' | 'ok'
}

export function StatRow({
  items,
  loading,
  label = 'Özet',
}: {
  items: StatItem[]
  loading?: boolean
  label?: string
}) {
  if (loading) {
    return (
      <div className="ui-stat-row ui-stat-row--skeleton" aria-busy="true" aria-label={label}>
        {Array.from({ length: Math.min(items.length || 4, 4) }, (_, i) => (
          <div key={i} className="ui-stat-card">
            <span className="skeleton-line skeleton-line--sm" />
            <span className="skeleton-line skeleton-line--lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="ui-stat-row" aria-label={label}>
      {items.map((item) => (
        <div key={item.id} className={`ui-stat-card tone-${item.tone ?? 'brand'}`}>
          <span className="muted">{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="ui-empty">
      <strong>{title}</strong>
      {description ? <p className="muted">{description}</p> : null}
      {action}
    </div>
  )
}

export function ActionCard({
  to,
  title,
  description,
  meta,
  highlight,
}: {
  to: string
  title: string
  description: string
  meta?: string
  highlight?: boolean
}) {
  return (
    <Link to={to} className={`ui-action-card${highlight ? ' is-highlight' : ''}`}>
      <span className="ui-action-mark" aria-hidden />
      <span className="ui-action-copy">
        <strong>{title}</strong>
        <span className="muted">{description}</span>
        {meta ? <em>{meta}</em> : null}
      </span>
    </Link>
  )
}

export function ActionCardGrid({ children }: { children: ReactNode }) {
  return <div className="ui-action-grid">{children}</div>
}
