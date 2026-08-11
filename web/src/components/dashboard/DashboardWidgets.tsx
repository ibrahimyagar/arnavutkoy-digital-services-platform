import { Link } from 'react-router-dom'
import './dashboard.css'

export function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export type SummaryItem = {
  id: string
  label: string
  value: string
  tone?: 'default' | 'warn' | 'ok'
}

export function SummaryCards({
  items,
  loading,
}: {
  items: SummaryItem[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="dash-summary" aria-busy="true" aria-label="Özet yükleniyor">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="dash-summary-card is-skeleton">
            <span className="skeleton-line skeleton-line--sm" />
            <span className="skeleton-line skeleton-line--lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="dash-summary" aria-label="Özet">
      {items.map((item) => (
        <article key={item.id} className={`dash-summary-card tone-${item.tone ?? 'default'}`}>
          <span className="dash-summary-label">{item.label}</span>
          <strong className="dash-summary-value">{item.value}</strong>
        </article>
      ))}
    </div>
  )
}

export type StatusItem = {
  id: string
  title: string
  detail: string
  to: string
  tone?: 'default' | 'warn' | 'ok'
}

export function ServiceStatus({ items }: { items: StatusItem[] }) {
  if (items.length === 0) return null
  return (
    <section className="dash-section">
      <header className="dash-section-head">
        <h2>Servis durumu</h2>
      </header>
      <ul className="dash-status-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={item.to} className={`dash-status-row tone-${item.tone ?? 'default'}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
              <span className="dash-status-go" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export type ActivityItem = {
  id: string
  title: string
  meta: string
  to: string
}

export function RecentActivity({
  items,
  loading,
  emptyText = 'Henüz işlem yok.',
}: {
  items: ActivityItem[]
  loading?: boolean
  emptyText?: string
}) {
  return (
    <section className="dash-section">
      <header className="dash-section-head">
        <h2>Son işlemler</h2>
      </header>
      {loading ? (
        <div className="dash-activity is-skeleton" aria-busy="true">
          <span className="skeleton-line skeleton-line--xl" />
          <span className="skeleton-line skeleton-line--xl" />
          <span className="skeleton-line skeleton-line--xl" />
        </div>
      ) : items.length === 0 ? (
        <p className="dash-empty muted">{emptyText}</p>
      ) : (
        <ul className="dash-activity">
          {items.map((item) => (
            <li key={item.id}>
              <Link to={item.to} className="dash-activity-row">
                <strong>{item.title}</strong>
                <span className="muted">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export type QuickItem = {
  id: string
  title: string
  description: string
  to: string
}

export function QuickActions({ items }: { items: QuickItem[] }) {
  return (
    <section className="dash-section">
      <header className="dash-section-head">
        <h2>Hızlı erişim</h2>
      </header>
      <div className="dash-quick-grid">
        {items.map((item) => (
          <Link key={item.id} to={item.to} className="dash-quick-card">
            <strong>{item.title}</strong>
            <span className="muted">{item.description}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
