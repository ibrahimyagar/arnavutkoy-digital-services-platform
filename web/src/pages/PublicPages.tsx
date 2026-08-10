import { useEffect, useState } from 'react'
import { apiFetch, type Announcement, type Paginated } from '../lib/api'

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<Announcement>>('/api/v1/announcements')
        setItems(page.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Duyurular yüklenemedi.')
      }
    })()
  }, [])

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Duyurular</h1>
        <p className="muted">Yayımlanmış belediye duyuruları.</p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="panel">
            <h3 style={{ marginTop: 0 }}>{item.title}</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {item.publishStartUtc
                ? new Date(item.publishStartUtc).toLocaleString('tr-TR')
                : new Date(item.createdAtUtc).toLocaleString('tr-TR')}
              {item.publishEndUtc
                ? ` · Geçerlilik: ${new Date(item.publishEndUtc).toLocaleString('tr-TR')}`
                : ''}
            </p>
            <p style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{item.content}</p>
          </article>
        ))}
        {items.length === 0 && !error ? <p className="muted">Yayında duyuru yok.</p> : null}
      </div>
    </div>
  )
}
