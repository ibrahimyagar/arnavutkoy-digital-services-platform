import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PublicPage } from '../components/ui/PublicPage'
import { BusLineSchedulePanel } from '../components/transport/BusLineSchedulePanel'
import { TransportContinue, TransportNav } from '../components/transport/TransportChrome'
import { TransportMap } from '../components/transport/TransportMap'
import { apiFetch, type BusLine, type BusLineDetails, type BusStopSearchResult } from '../lib/api'
import { upcomingDepartures } from '../lib/busSchedule'
import {
  CATALOG_CHECKED,
  CATALOG_LIST_DATE,
  IETT_TARIFF,
  iettHref,
  isExactCode,
  matchesPlace,
  matchLandmark,
  parseLineSummary,
  presentKinds,
  presentNeighborhoods,
  presentPlaces,
  searchLine,
  sortLines,
  sortedStops,
  type LineKind,
  type LineSort,
} from '../lib/busLineVisuals'
import { isFavoriteLine, toggleFavoriteLine } from '../lib/transportFavorites'
import { useAuth } from '../auth/AuthContext'
import { loginPath } from '../lib/returnUrl'
import './bus-lines.css'

const NOTICE =
  'Demo ulaşım bilgilendirme modülü — Ağustos 2026 tarifesi. Canlı İETT/İBB API bağlantısı yoktur; sefer saatleri gerçekçi örnek veridir. Resmi tarife ve anlık konum için İETT kaynaklarını kullanın.'

function SearchIcon() {
  return (
    <svg className="tx-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function kindFromParam(value: string | null): LineKind | 'Tümü' {
  if (value === 'bus' || value === 'Normal') return 'Normal'
  if (value === 'Besleme' || value === 'Ekspres') return value
  return 'Tümü'
}

function sortFromParam(value: string | null): LineSort {
  if (value === 'duration' || value === 'durationDesc' || value === 'name') return value
  return 'code'
}

function statusFromParam(value: string | null): 'active' | 'inactive' | 'all' {
  if (value === 'inactive' || value === 'all') return value
  return 'active'
}

export function BusLinesPage() {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState<BusLine[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const [stopHits, setStopHits] = useState<BusStopSearchResult[]>([])
  const [stopLoading, setStopLoading] = useState(false)

  const q = params.get('q') ?? params.get('search') ?? ''
  const kind = kindFromParam(params.get('type'))
  const place = params.get('place') || 'Tümü'
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const sort = sortFromParam(params.get('sort'))
  const status = statusFromParam(params.get('status'))

  function patch(next: Record<string, string | null>) {
    const copy = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 'Tümü') copy.delete(key)
      else copy.set(key, value)
    }
    setParams(copy, { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const lines = await apiFetch<BusLine[]>(
          status === 'active' ? '/api/v1/bus-lines' : '/api/v1/bus-lines?activeOnly=false',
        )
        if (!cancelled) {
          setItems(lines)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Ulaşım verilerine ulaşılamıyor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reload, status])

  useEffect(() => {
    const needle = q.trim()
    if (needle.length < 2) {
      setStopHits([])
      return
    }
    let cancelled = false
    setStopLoading(true)
    void (async () => {
      try {
        const hits = await apiFetch<BusStopSearchResult[]>(
          `/api/v1/bus-lines/stops/search?q=${encodeURIComponent(needle)}&limit=8`,
        )
        if (!cancelled) setStopHits(hits)
      } catch {
        if (!cancelled) setStopHits([])
      } finally {
        if (!cancelled) setStopLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [q])

  const kinds = useMemo(() => presentKinds(items), [items])
  const neighborhoods = useMemo(() => presentNeighborhoods(items), [items])
  const places = useMemo(() => presentPlaces(items), [items])
  const needle = q.trim().toLocaleLowerCase('tr-TR')

  const filtered = useMemo(() => {
    const list = sortLines(items, sort, q)
    return list.filter((line) => {
      const parsed = parseLineSummary(line.routeSummary)
      if (kind !== 'Tümü' && parsed.kind !== kind) return false
      if (place !== 'Tümü' && !parsed.neighborhoods.includes(place)) return false
      if (status === 'active' && !line.isActive) return false
      if (status === 'inactive' && line.isActive) return false
      if (from && !matchesPlace(line, from)) return false
      if (to && !matchesPlace(line, to)) return false
      return searchLine(line, needle)
    })
  }, [items, q, needle, kind, place, from, to, sort, status])

  const knownKind = items.filter((line) => parseLineSummary(line.routeSummary).kind).length
  const exact = items.find((line) => isExactCode(line, q))

  return (
    <PublicPage immersive className="pub--wide" title="Ulaşım rehberi">
      <div className="tx">
        <TransportNav />
        <header className="tx-hero">
          <p className="tx-kicker">Arnavutköy ulaşım rehberi</p>
          <h1>Hatları, güzergâhları ve sefer saatlerini keşfedin.</h1>
          <p>Gitmek istediğiniz yere giden hattı bulun; durak ve demo tarife saatlerini tek ekranda görün.</p>
          <div className="tx-search">
            <label htmlFor="tx-q">Hat numarası, durak veya mahalle ara</label>
            <div className="tx-search-box">
              <SearchIcon />
              <input
                id="tx-q"
                value={q}
                onChange={(event) => patch({ q: event.target.value })}
                placeholder="336, Hadımköy, Taşoluk, Arnavutköy Merkez…"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <p className="tx-live" aria-live="polite">
              {loading ? 'Hatlar yükleniyor…' : `${filtered.length} hat bulundu`}
            </p>
            {exact ? (
              <p className="tx-jump">
                <Link to={`/hatlar/${exact.id}`}>{exact.code} hattını aç →</Link>
              </p>
            ) : null}
            {stopLoading ? <p className="tx-muted">Duraklar aranıyor…</p> : null}
            {!stopLoading && stopHits.length > 0 ? (
              <ul className="tx-stop-hits" aria-label="Durak eşleşmeleri">
                {stopHits.map((hit) => (
                  <li key={hit.stopId}>
                    <Link to={`/hatlar/${hit.busLineId}`}>
                      <strong>{hit.stopName}</strong>
                      <span>
                        {hit.busLineCode} · {hit.sequence}. durak
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="error-box">
            {error}{' '}
            <button type="button" className="btn btn-ghost" onClick={() => setReload((n) => n + 1)}>
              Tekrar dene
            </button>
          </div>
        ) : null}

        <div className="tx-ruler" aria-label="Katalog özeti">
          <p>
            <strong>{loading ? '—' : items.length}</strong>
            <span>Hat</span>
          </p>
          <p>
            <strong>{loading ? '—' : places.length}</strong>
            <span>Güzergâh ucu</span>
          </p>
          <p>
            <strong>{loading ? '—' : neighborhoods.length}</strong>
            <span>Mahalle adı</span>
          </p>
          <p>
            <strong>{loading ? '—' : knownKind}</strong>
            <span>İETT tipi kayıtlı</span>
          </p>
        </div>

        <section className="tx-block" aria-labelledby="tx-path-title">
          <header className="tx-head">
            <p className="tx-kicker">Güzergâh</p>
            <h2 id="tx-path-title">Nereden nereye?</h2>
          </header>
          <form className="tx-path" onSubmit={(event) => event.preventDefault()}>
            <label>
              Nereden?
              <select value={from} onChange={(event) => patch({ from: event.target.value })}>
                <option value="">Tümü</option>
                {places.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nereye?
              <select value={to} onChange={(event) => patch({ to: event.target.value })}>
                <option value="">Tümü</option>
                {places.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sıra
              <select value={sort} onChange={(event) => patch({ sort: event.target.value })}>
                <option value="code">Hat numarası</option>
                <option value="duration">En kısa yolculuk (İETT süre)</option>
                <option value="durationDesc">En uzun yolculuk (İETT süre)</option>
                <option value="name">Alfabetik</option>
              </select>
            </label>
          </form>
          <p className="tx-muted">
            Sıralama kayıtlı İETT süresine göredir. Sefer sıklığı hat detayında demo tarife tablosunda gösterilir.
          </p>
        </section>

        <section className="tx-block" aria-labelledby="tx-filter-title">
            <header className="tx-head">
              <p className="tx-kicker">Filtre</p>
              <h2 id="tx-filter-title">Hat tipi ve mahalle</h2>
            </header>
            <div className="tx-chips" role="toolbar" aria-label="Durum">
              <button type="button" className={status === 'active' ? 'is-on' : ''} aria-pressed={status === 'active'} onClick={() => patch({ status: null })}>
                Katalogda
              </button>
              <button type="button" className={status === 'inactive' ? 'is-on' : ''} aria-pressed={status === 'inactive'} onClick={() => patch({ status: 'inactive' })}>
                Yayımlanmıyor
              </button>
              <button type="button" className={status === 'all' ? 'is-on' : ''} aria-pressed={status === 'all'} onClick={() => patch({ status: 'all' })}>
                Tümü
              </button>
            </div>
            <div className="tx-chips" role="toolbar" aria-label="Hat tipi">
              <button type="button" className={kind === 'Tümü' ? 'is-on' : ''} aria-pressed={kind === 'Tümü'} onClick={() => patch({ type: null })}>
                Tümü
              </button>
              {kinds.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={kind === label ? 'is-on' : ''}
                  aria-pressed={kind === label}
                  onClick={() => patch({ type: label })}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="tx-chips tx-chips--wrap" role="toolbar" aria-label="Mahalle">
              <button
                type="button"
                className={place === 'Tümü' ? 'is-on' : ''}
                aria-pressed={place === 'Tümü'}
                onClick={() => patch({ place: null })}
              >
                Tüm mahalleler
              </button>
              {neighborhoods.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={place === name ? 'is-on' : ''}
                  aria-pressed={place === name}
                  onClick={() => patch({ place: name })}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

        <section className="tx-block" aria-labelledby="tx-list-title">
          <header className="tx-head">
            <p className="tx-kicker">Hatlar</p>
            <h2 id="tx-list-title">{needle || from || to ? 'Arama sonuçları' : 'Katalog'}</h2>
          </header>
          {loading ? <p className="tx-muted">Hatlar yükleniyor…</p> : null}
          {!loading && filtered.length === 0 ? (
            <div className="tx-empty">
              <strong>Aramanızla eşleşen hat bulunamadı.</strong>
              <p>336, Hadımköy veya Taşoluk yazmayı deneyin. Olmayan güzergâh gösterilmez.</p>
            </div>
          ) : (
            <ul className="tx-lines">
              {filtered.map((line) => {
                const parsed = parseLineSummary(line.routeSummary)
                return (
                  <li key={line.id}>
                    <Link to={`/hatlar/${line.id}`}>
                      <span className="tx-headsign">{line.code}</span>
                      <span>
                        <strong>{line.name}</strong>
                        <em>{parsed.route || line.routeSummary}</em>
                        <em className="tx-meta">
                          {parsed.kind ?? 'Normal'}
                          {parsed.durationMin ? ` · ${parsed.durationMin} dk` : ''}
                          {' · '}
                          {line.isActive ? 'Aktif hat' : 'Yayımlanmıyor'}
                        </em>
                      </span>
                      <span className="tx-go">Güzergahı gör</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <aside className="tx-notice">
          <p className="tx-kicker">Kaynak</p>
          <h2>Veri nereden geliyor?</h2>
          <p>
            Belediye İETT listesi ve demo tarife dönemi: {CATALOG_LIST_DATE}. Hat adları {CATALOG_CHECKED} içinde İETT
            RouteDetail ile yoklandı. Sefer saatleri demo veridir; canlı konum İETT uygulamasındadır.
          </p>
          <p>
            <a href={IETT_TARIFF} target="_blank" rel="noreferrer">
              İETT ücret tarifesi →
            </a>
          </p>
        </aside>

        <TransportContinue exclude="/hatlar" />
        <p className="tx-note">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}

export function BusLineDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const [detail, setDetail] = useState<BusLineDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fav, setFav] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setDetail(null)
    setError(null)
    setFav(isFavoriteLine(id))
    void (async () => {
      try {
        const item = await apiFetch<BusLineDetails>(`/api/v1/bus-lines/${id}`)
        if (!cancelled) setDetail(item)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Hat detayı yüklenemedi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, reload])

  const parsed = detail ? parseLineSummary(detail.routeSummary) : null
  const stops = detail ? sortedStops(detail.stops) : []
  const nextDepartures = useMemo(
    () => (detail ? upcomingDepartures(detail.departures) : []),
    [detail],
  )

  if (error) {
    return (
      <div className="container page">
        <TransportNav />
        <div className="error-box">
          {error}{' '}
          <button type="button" className="btn btn-ghost" onClick={() => setReload((n) => n + 1)}>
            Tekrar dene
          </button>
        </div>
        <p>
          <Link to="/hatlar">← Tüm hatlara dön</Link>
        </p>
      </div>
    )
  }

  if (!detail || !parsed) {
    return (
      <div className="container page">
        <p className="muted">Hat yükleniyor…</p>
      </div>
    )
  }

  const official = iettHref(detail.code)
  const planTo = parsed.origin && parsed.destination
    ? `/hatlar?from=${encodeURIComponent(parsed.origin)}&to=${encodeURIComponent(parsed.destination)}`
    : '/hatlar'

  return (
    <PublicPage immersive className="pub--wide" title={`${detail.code} ${detail.name}`}>
      <div className="tx tx-detail">
        <TransportNav />
        <Link className="tx-back" to="/hatlar">
          ← Tüm hatlara dön
        </Link>
        <header className="txd-hero">
          <span className="tx-headsign tx-headsign--lg">{detail.code}</span>
          <div>
            <p className="tx-kicker">Hat kartı</p>
            <h1>{detail.name}</h1>
            <p>{parsed.route || 'Güzergâh özeti yok.'}</p>
            <div className="txd-meta">
              <span>{parsed.kind ?? 'Tip doğrulanıyor'}</span>
              {parsed.tariff ? <span>{parsed.tariff}</span> : <span>Tarife: İstanbulkart</span>}
              {parsed.durationMin ? <span>Tek yön {parsed.durationMin} dk</span> : null}
              <span>{detail.isActive ? 'Aktif hat' : 'Yayımlanmıyor'}</span>
              <span>{stops.length} durak</span>
              {detail.departures.length > 0 ? <span>{detail.departures.length} sefer kaydı</span> : null}
              {nextDepartures[0] ? <span>Sıradaki: {nextDepartures[0].time}</span> : null}
            </div>
            <div className="tx-cta-row">
              <a className="btn btn-primary" href={official} target="_blank" rel="noreferrer">
                İETT’te aç
              </a>
              <Link className="btn btn-ghost" to={planTo}>
                Rotayı planla
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (matchLandmark(parsed.origin) || matchLandmark(parsed.destination)) {
                    document.getElementById('harita')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                  }
                  const query = parsed.origin || parsed.destination || detail.name
                  window.open(
                    `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`,
                    '_blank',
                    'noreferrer',
                  )
                }}
              >
                Haritada göster
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                aria-pressed={fav}
                onClick={() => setFav(toggleFavoriteLine(detail.id).includes(detail.id))}
              >
                {fav ? 'Favoriden çıkar' : 'Favorilere ekle'}
              </button>
              <Link className="btn btn-ghost" to={isAuthenticated ? '/binis' : loginPath('/binis')}>
                Biniş simülasyonu
              </Link>
            </div>
          </div>
        </header>

        <section className="tx-block" aria-labelledby="tx-route-title">
          <header className="tx-head">
            <p className="tx-kicker">Güzergâh</p>
            <h2 id="tx-route-title">Durak sırası</h2>
          </header>
          <ol className="tx-route" aria-label="Durak listesi">
          {stops.length === 0 ? (
            <li>
              <span>01</span>
              <span className="tx-dot" aria-hidden />
              <div>
                <strong>Durak uçları henüz işlenmedi.</strong>
                <em>Resmi kaynaktan güncelleniyor</em>
              </div>
            </li>
          ) : (
            stops.map((stop, index) => (
              <li key={stop.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span className="tx-dot" aria-hidden />
                <div>
                  <Link to={`/hatlar?q=${encodeURIComponent(stop.name)}`}>
                    <strong>{stop.name}</strong>
                  </Link>
                  <em>
                    {index === 0 ? 'Başlangıç durağı' : index === stops.length - 1 ? 'Bitiş durağı' : `${index + 1}. durak`}
                  </em>
                </div>
              </li>
            ))
          )}
        </ol>
        </section>
        <p className="tx-muted">
          Durak sırası demo katalog verisidir. Ara durakların tam listesi ve harita geometrisi İETT sayfasında
          güncellenir.
        </p>

        <TransportMap
          title={`${detail.code} güzergâh uçları`}
          origin={parsed.origin}
          destination={parsed.destination}
        />

        <BusLineSchedulePanel departures={detail.departures} lineCode={detail.code} />

        <div className="txd-grid">
          <section>
            <p className="tx-kicker">Simülasyon ücreti</p>
            <h2>Biniş denemesi: {detail.baseFare.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h2>
            <p>
              Kart biniş simülasyonu için demo ücret. Resmi İstanbulkart tarifesi{' '}
              {parsed.tariff ? parsed.tariff.toLocaleLowerCase('tr-TR') : 'İETT tarifesine'} tabidir.
            </p>
          </section>
          <section>
            <p className="tx-kicker">Ücret tarifesi</p>
            <h2>Resmi tarife İETT’te</h2>
            <p>Güncel tam/kısıtlı bilet ücretleri İETT tarife sayfasından doğrulanmalıdır.</p>
            <p>
              <a href={IETT_TARIFF} target="_blank" rel="noreferrer">
                İETT ücret tarifesi →
              </a>
            </p>
          </section>
        </div>

        {parsed.note ? (
          <aside className="tx-notice">
            <p className="tx-kicker">İETT notu</p>
            <p>{parsed.note}</p>
          </aside>
        ) : (
          <aside className="tx-notice">
            <p className="tx-kicker">Duyuru</p>
            <p>Demo tarife Ağustos 2026 dönemini yansıtır. Resmi duyurular İETT kaynaklarından izlenir.</p>
          </aside>
        )}

        <p className="tx-muted">
          Kaynak: {parsed.source ?? 'İETT / Arnavutköy Belediyesi'} · Liste: {parsed.listDate ?? CATALOG_LIST_DATE} ·
          Kontrol: {CATALOG_CHECKED}
        </p>

        <TransportContinue />
        <p className="tx-note">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}
