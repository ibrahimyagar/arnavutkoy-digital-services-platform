import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage, PublicRelated, PublicSection } from '../components/ui/PublicPage'
import { apiFetch, type BusLine, type BusLineDetails } from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'

const dayLabels: Record<string, string> = {
  Sunday: 'Pazar',
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
  Saturday: 'Cumartesi',
}

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export function BusLinesPage() {
  const [items, setItems] = useState<BusLine[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void apiFetch<BusLine[]>('/api/v1/bus-lines')
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Hatlar yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    const list = [...items].sort((a, b) => a.code.localeCompare(b.code, 'tr'))
    if (!needle) return list
    return list.filter((line) =>
      `${line.code} ${line.name} ${line.routeSummary}`.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [items, q])

  const avgFare =
    items.length === 0 ? 0 : items.reduce((sum, line) => sum + line.baseFare, 0) / items.length

  return (
    <PublicPage
      eyebrow="Ulaşım"
      title="Otobüs hatları"
      lead="Arnavutköy temalı güzergâhlar — demo hat verisi."
      cover={COVERS.projects}
    >
      {error ? <div className="error-box">{error}</div> : null}

      {loading ? (
        <div className="stats-strip stats-strip--skeleton" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <span className="skeleton-line skeleton-line--sm" />
              <span className="skeleton-line skeleton-line--lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-strip" aria-label="Hat özeti">
          <div>
            <span className="muted">Hat</span>
            <strong>{items.length}</strong>
          </div>
          <div>
            <span className="muted">Listelenen</span>
            <strong>{filtered.length}</strong>
          </div>
          <div>
            <span className="muted">Ort. ücret</span>
            <strong>{money(avgFare)}</strong>
          </div>
          <div>
            <span className="muted">En düşük</span>
            <strong>
              {items.length === 0
                ? '—'
                : money(Math.min(...items.map((line) => line.baseFare)))}
            </strong>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="bus-search">Hat ara</label>
        <input
          id="bus-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="36AS, Durusu, Hadımköy…"
        />
      </div>

      <div className="pub-hub-grid">
        {filtered.map((line) => (
          <Link key={line.id} to={`/hatlar/${line.id}`}>
            <strong>
              {line.code} — {line.name}
            </strong>
            <span>
              {line.routeSummary || 'Güzergâh özeti yok'} · {money(line.baseFare)}
            </span>
          </Link>
        ))}
      </div>
      {!loading && filtered.length === 0 ? <p className="muted">Bu aramada hat yok.</p> : null}
      <PublicRelated items={RELATED.transport} />
    </PublicPage>
  )
}

export function BusLineDetailPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState<BusLineDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    void apiFetch<BusLineDetails>(`/api/v1/bus-lines/${id}`)
      .then(setDetail)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Hat detayı yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const departuresByDay = useMemo(() => {
    if (!detail) return []
    return DAY_ORDER.map((day) => ({
      day,
      label: dayLabels[day] ?? day,
      items: detail.departures
        .filter((d) => d.dayOfWeek === day)
        .sort((a, b) => a.departureTime.localeCompare(b.departureTime)),
    })).filter((group) => group.items.length > 0)
  }, [detail])

  return (
    <PublicPage
      eyebrow="Ulaşım"
      title={detail ? `${detail.code} — ${detail.name}` : 'Hat detayı'}
      lead={detail?.routeSummary || 'Güzergâh ve hareket saatleri'}
      cover={COVERS.projects}
    >
      <p className="muted" style={{ margin: 0 }}>
        <Link to="/hatlar">← Tüm hatlar</Link>
      </p>
      {error ? <div className="error-box">{error}</div> : null}

      {loading && !detail ? (
        <PublicSection tone="soft">
          <div className="stack" aria-busy="true">
            <span className="skeleton-line skeleton-line--sm" />
            <span className="skeleton-line skeleton-line--lg" />
            <span className="skeleton-line skeleton-line--xl" />
          </div>
        </PublicSection>
      ) : null}

      {detail ? (
        <>
          <div className="stats-strip" aria-label="Hat detay özeti">
            <div>
              <span className="muted">Ücret</span>
              <strong>{money(detail.baseFare)}</strong>
            </div>
            <div>
              <span className="muted">Durak</span>
              <strong>{detail.stops.length}</strong>
            </div>
            <div>
              <span className="muted">Sefer</span>
              <strong>{detail.departures.length}</strong>
            </div>
            <div>
              <span className="muted">Durum</span>
              <strong>{detail.isActive ? 'Aktif' : 'Pasif'}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link className="btn btn-primary" to="/binis">
              Bu hatla bin (simülasyon)
            </Link>
            <Link className="btn btn-ghost" to="/ulasim">
              Ulaşım kartım
            </Link>
          </div>

          <PublicSection title="Duraklar" tone="soft">
            {detail.stops.length === 0 ? (
              <p className="muted">Bu hat için durak tanımlanmamış.</p>
            ) : (
              <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.45rem' }}>
                {[...detail.stops]
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((stop) => (
                    <li key={stop.id}>
                      <strong>{stop.sequence}.</strong> {stop.name}
                    </li>
                  ))}
              </ol>
            )}
          </PublicSection>

          <PublicSection title="Hareket saatleri" tone="soft">
            {departuresByDay.length === 0 ? (
              <p className="muted">Hareket saati yok.</p>
            ) : (
              <div className="stack">
                {departuresByDay.map((group) => (
                  <div key={group.day}>
                    <strong>{group.label}</strong>
                    <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                      {group.items.map((dep) => (
                        <li key={dep.id}>
                          {dep.departureTime.slice(0, 5)}
                          {dep.note ? ` — ${dep.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </PublicSection>
        </>
      ) : null}
      <PublicRelated items={RELATED.transport} />
    </PublicPage>
  )
}
