import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, type BusLine, type BusLineDetails } from '../lib/api'

const dayLabels: Record<string, string> = {
  Sunday: 'Pazar',
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
  Saturday: 'Cumartesi',
}

export function BusLinesPage() {
  const [items, setItems] = useState<BusLine[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setItems(await apiFetch<BusLine[]>('/api/v1/bus-lines'))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hatlar yüklenemedi.')
      }
    })()
  }, [])

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Otobüs hatları</h1>
        <p className="muted">Güzergâh özeti ve taban ücretler.</p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="stack">
        {items.map((line) => (
          <article key={line.id} className="panel">
            <h3>
              <Link to={`/hatlar/${line.id}`}>
                {line.code} — {line.name}
              </Link>
            </h3>
            <p className="muted">{line.routeSummary}</p>
            <strong>₺{line.baseFare.toFixed(2)}</strong>
          </article>
        ))}
      </div>
    </div>
  )
}

export function BusLineDetailPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState<BusLineDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        setDetail(await apiFetch<BusLineDetails>(`/api/v1/bus-lines/${id}`))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hat detayı yüklenemedi.')
      }
    })()
  }, [id])

  return (
    <div className="container stack">
      <p className="muted">
        <Link to="/hatlar">← Hatlar</Link>
      </p>
      {error ? <div className="error-box">{error}</div> : null}
      {detail ? (
        <>
          <div className="panel">
            <h1 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.35rem', fontSize: '2rem' }}>
              {detail.code} — {detail.name}
            </h1>
            <p className="muted">{detail.routeSummary}</p>
            <strong>Taban ücret: ₺{detail.baseFare.toFixed(2)}</strong>
          </div>

          <section className="panel stack">
            <h3>Duraklar</h3>
            {detail.stops.length === 0 ? (
              <p className="muted">Bu hat için durak tanımlanmamış.</p>
            ) : (
              <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.45rem' }}>
                {detail.stops.map((stop) => (
                  <li key={stop.id}>
                    <strong>{stop.sequence}.</strong> {stop.name}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="panel stack">
            <h3>Hareket saatleri</h3>
            {detail.departures.length === 0 ? (
              <p className="muted">Hareket saati yok.</p>
            ) : (
              <div className="stack">
                {detail.departures.map((dep) => (
                  <div
                    key={dep.id}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}
                  >
                    <span>
                      {dayLabels[dep.dayOfWeek] ?? dep.dayOfWeek} · {dep.departureTime.slice(0, 5)}
                    </span>
                    <span className="muted">{dep.note || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
