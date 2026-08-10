import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type BusLine } from '../lib/api'
import { moduleVisual, type ModuleTile } from '../lib/modules'
import '../pages/home.css'

const HUB_TILES: ModuleTile[] = [
  {
    id: 'bus-lines',
    title: 'Hat listesi',
    description: 'Güzergâh, durak ve ücret',
    to: '/hatlar',
    requiresAuth: false,
    audience: 'public',
    visual: 'transit',
  },
  {
    id: 'transport',
    title: 'Kartlarım',
    description: 'Kart çıkar, bakiye yükle',
    to: '/ulasim',
    requiresAuth: true,
    audience: 'citizen',
    visual: 'card',
  },
  {
    id: 'simulator',
    title: 'Biniş simülasyonu',
    description: 'Hat → kart → bin',
    to: '/binis',
    requiresAuth: true,
    audience: 'citizen',
    visual: 'board',
  },
  {
    id: 'cash-desk',
    title: 'Dijital vezne',
    description: 'Borç ve bakiye hub',
    to: '/vezne',
    requiresAuth: true,
    audience: 'citizen',
    visual: 'cash',
  },
]

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

/** Referans `transport.php` hub: alt modül kartları + hat tablosu. */
export function TransportNetworkPage() {
  const [lines, setLines] = useState<BusLine[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void apiFetch<BusLine[]>('/api/v1/bus-lines')
      .then(setLines)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Hatlar yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    const list = [...lines].sort((a, b) => a.code.localeCompare(b.code, 'tr'))
    if (!needle) return list
    return list.filter((line) =>
      `${line.code} ${line.name} ${line.routeSummary}`.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [lines, q])

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Ulaşım ağı</h1>
        <p className="muted">
          Referans projedeki ulaşım hub’ı: hatlar, kart, biniş ve vezne tek çatıda.
        </p>
      </div>

      <div className="module-grid">
        {HUB_TILES.map((mod) => {
          const visual = moduleVisual(mod)
          return (
            <Link key={mod.id} to={mod.to} className="module-tile">
              <span className={`module-visual module-visual--${visual}`} aria-hidden>
                <span className="module-visual-label">{mod.title}</span>
              </span>
              <span className={`module-badge ${mod.requiresAuth ? 'is-auth' : 'is-public'}`}>
                {mod.requiresAuth ? 'Üyelik gerekir' : 'Üyeliksiz'}
              </span>
              <h3>{mod.title}</h3>
              <p>{mod.description}</p>
            </Link>
          )
        })}
      </div>

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
        <div className="stats-strip" aria-label="Ağ özeti">
          <div>
            <span className="muted">Hat</span>
            <strong>{lines.length}</strong>
          </div>
          <div>
            <span className="muted">Listelenen</span>
            <strong>{filtered.length}</strong>
          </div>
          <div>
            <span className="muted">Ort. ücret</span>
            <strong>
              {lines.length
                ? money(lines.reduce((sum, line) => sum + line.baseFare, 0) / lines.length)
                : '—'}
            </strong>
          </div>
          <div>
            <span className="muted">En düşük</span>
            <strong>
              {lines.length ? money(Math.min(...lines.map((line) => line.baseFare))) : '—'}
            </strong>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="net-search">Hat ara</label>
        <input
          id="net-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="36AS, Durusu, Hadımköy…"
        />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hat</th>
              <th>Güzergâh</th>
              <th>Ücret</th>
              <th>Detay</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((line) => (
              <tr key={line.id}>
                <td>
                  <strong>
                    {line.code} — {line.name}
                  </strong>
                </td>
                <td>{line.routeSummary || '—'}</td>
                <td>{money(line.baseFare)}</td>
                <td>
                  <Link className="btn btn-ghost" to={`/hatlar/${line.id}`}>
                    Saatler
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  Bu aramada hat yok.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
