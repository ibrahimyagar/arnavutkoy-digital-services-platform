import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PublicPage } from '../components/ui/PublicPage'
import { TransportContinue, TransportNav } from '../components/transport/TransportChrome'
import { TransportMap } from '../components/transport/TransportMap'
import { apiFetch, type BusLine } from '../lib/api'
import {
  CATALOG_CHECKED,
  parseLineSummary,
  presentPlaces,
  searchLine,
  TRANSFER_POINTS,
} from '../lib/busLineVisuals'
import { useAuth } from '../auth/AuthContext'
import { loginPath } from '../lib/returnUrl'
import './bus-lines.css'

const NOTICE =
  'Demo ulaşım bilgilendirme modülü — Ağustos 2026 tarifesi. Canlı İETT/İBB API yoktur; sefer saatleri gerçekçi örnek veridir.'

export function TransportNetworkPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<BusLine[]>([])
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const lines = await apiFetch<BusLine[]>('/api/v1/bus-lines')
        if (!cancelled) setItems(lines)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ulaşım verilerine ulaşılamıyor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (location.hash !== '#harita' || loading) return
    document.getElementById('harita')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, loading])

  const places = useMemo(() => presentPlaces(items), [items])
  const suggestions = useMemo(() => {
    const set = new Set(places)
    for (const point of TRANSFER_POINTS) set.add(point.label)
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
  }, [places])

  const preview = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return items
      .filter((line) => {
        if (from && !searchLine(line, from.toLocaleLowerCase('tr-TR'))) return false
        if (to && !searchLine(line, to.toLocaleLowerCase('tr-TR'))) return false
        return searchLine(line, needle)
      })
      .slice(0, 5)
  }, [items, q, from, to])

  const knownKind = items.filter((line) => parseLineSummary(line.routeSummary).kind).length

  function plan(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    navigate(`/hatlar?${params.toString()}`)
  }

  return (
    <PublicPage immersive className="pub--wide" title="Ulaşım merkezi">
      <div className="tx">
        <TransportNav />
        <header className="tx-hero">
          <p className="tx-kicker">Arnavutköy ulaşım merkezi</p>
          <h1>Arnavutköy’de ulaşım artık tek ekranda.</h1>
          <p>
            Hatları keşfedin, güzergâh uçlarını inceleyin, kartınızı yönetin. Saat ve ücret canlı İETT verisi
            değildir.
          </p>
          <form className="tx-plan" onSubmit={plan}>
            <label>
              Ara
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="336, Hadımköy, havalimanı…"
                list="tx-places"
                autoComplete="off"
              />
            </label>
            <label>
              Nereden?
              <input
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                placeholder="Arnavutköy, Taşoluk…"
                list="tx-places"
                autoComplete="off"
              />
            </label>
            <label>
              Nereye?
              <input
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="Eminönü, İstanbul Havalimanı…"
                list="tx-places"
                autoComplete="off"
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Rotayı bul
            </button>
            <datalist id="tx-places">
              {suggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </form>
          <p className="tx-muted">
            Eşleşme resmi hat adındaki uçlara göredir. Listede yoksa güzergâh uydurulmaz.
          </p>
        </header>

        {error ? (
          <div className="error-box">
            {error}{' '}
            <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
              Tekrar dene
            </button>
          </div>
        ) : null}

        <div className="tx-ruler" aria-label="Katalog özeti">
          <p>
            <strong>{loading ? '—' : items.length}</strong>
            <span>Aktif hat</span>
          </p>
          <p>
            <strong>{loading ? '—' : places.length}</strong>
            <span>Güzergâh ucu</span>
          </p>
          <p>
            <strong>{loading ? '—' : knownKind}</strong>
            <span>İETT tipi kayıtlı</span>
          </p>
          <p>
            <strong>Demo</strong>
            <span>Canlı sefer yok</span>
          </p>
        </div>

        <section className="tx-block" aria-labelledby="tx-hubs-title">
          <header className="tx-head">
            <p className="tx-kicker">Aktarma</p>
            <h2 id="tx-hubs-title">Önemli uçlar</h2>
          </header>
          <div className="tx-hubs">
            {TRANSFER_POINTS.map((point) => (
              <Link key={point.label} to={`/hatlar?to=${encodeURIComponent(point.label)}`}>
                <strong>{point.label}</strong>
                <span>Örnek hat {point.hint}</span>
              </Link>
            ))}
          </div>
        </section>

        <TransportMap title="Aktarma ve önemli noktalar" />

        <section className="tx-block" aria-labelledby="tx-preview-title">
          <header className="tx-head">
            <p className="tx-kicker">Önizleme</p>
            <h2 id="tx-preview-title">{q || from || to ? 'Eşleşen hatlar' : 'Katalogdan beş hat'}</h2>
          </header>
          {loading ? <p className="tx-muted">Hatlar yükleniyor…</p> : null}
          {!loading && preview.length === 0 ? (
            <div className="tx-empty">
              <strong>Aramanızla eşleşen hat bulunamadı.</strong>
              <p>336, Hadımköy veya İstanbul Havalimanı yazın.</p>
            </div>
          ) : (
            <ul className="tx-lines">
              {preview.map((line) => {
                const parsed = parseLineSummary(line.routeSummary)
                return (
                  <li key={line.id}>
                    <Link to={`/hatlar/${line.id}`}>
                      <span className="tx-headsign">{line.code}</span>
                      <span>
                        <strong>{line.name}</strong>
                        <em>{parsed.route || line.name}</em>
                      </span>
                      <span className="tx-go">Güzergahı gör</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          <p>
            <Link className="btn btn-ghost" to="/hatlar">
              Tüm katalog →
            </Link>
          </p>
        </section>

        <section className="tx-desk" aria-labelledby="tx-ops-title">
          <header className="tx-head">
            <p className="tx-kicker">İşlem</p>
            <h2 id="tx-ops-title">Kart, biniş, vezne</h2>
          </header>
          <ol>
            <li>
              <strong>Kartlarım</strong>
              <span>Demo bakiye yükleyin. Giriş gerekir.</span>
              <Link to={isAuthenticated ? '/ulasim' : loginPath('/ulasim')}>Aç</Link>
            </li>
            <li>
              <strong>Biniş</strong>
              <span>Simülasyon ücreti kart bakiyesinden düşer; İETT tarife değildir.</span>
              <Link to={isAuthenticated ? '/binis' : loginPath('/binis')}>Aç</Link>
            </li>
            <li>
              <strong>Vezne</strong>
              <span>Borç ve kart yükleme aynı ödeme masasından.</span>
              <Link to={isAuthenticated ? '/vezne' : loginPath('/vezne')}>Aç</Link>
            </li>
          </ol>
        </section>

        <aside className="tx-notice">
          <p className="tx-kicker">Kaynak</p>
          <h2>Veri nereden geliyor?</h2>
          <p>
            Kontrol: {CATALOG_CHECKED}. Harita geometrisi ve tam durak sırası bu demoda yoktur; İETT sayfası
            esastır.
          </p>
        </aside>

        <TransportContinue exclude="/ulasim-agi" />
        <p className="tx-note">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}
