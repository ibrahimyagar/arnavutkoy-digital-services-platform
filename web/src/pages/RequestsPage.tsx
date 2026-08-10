import { useEffect, useState } from 'react'
import { apiFetch, type CitizenRequestSummary, type Paginated } from '../lib/api'
import { RequireAuth } from './PanelPage'

function RequestsContent() {
  const [data, setData] = useState<Paginated<CitizenRequestSummary> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<CitizenRequestSummary>>(
          '/api/v1/citizen-requests/mine',
          {},
          true,
        )
        setData(page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Talepler yüklenemedi.')
      }
    })()
  }, [])

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Taleplerim</h1>
        <p className="muted">Hizmet masası başvurularınızın durumları.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="stack">
        {data?.items.map((item) => (
          <article key={item.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3>Talep #{item.id.slice(0, 8)}</h3>
                <p className="muted">
                  {new Date(item.createdAtUtc).toLocaleString('tr-TR')}
                </p>
              </div>
              <span className="badge">{item.status}</span>
            </div>
          </article>
        ))}
        {data && data.items.length === 0 ? (
          <p className="muted">Henüz talep oluşturmadınız. (API üzerinden veya sonraki fazda form eklenecek.)</p>
        ) : null}
      </div>
    </div>
  )
}

export function RequestsPage() {
  return (
    <RequireAuth>
      <RequestsContent />
    </RequireAuth>
  )
}
