import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage } from '../components/ui/PublicPage'
import { apiFetch, type Neighborhood, type Paginated, type PortalContent } from '../lib/api'
import {
  CULTURE_CATEGORIES,
  CULTURE_ROUTE,
  coverForCulture,
  cultureGallery,
  cultureHref,
  cultureVenueForEvent,
  eventsForVenue,
  isCultureId,
  neighborhoodForVenue,
  newsForVenue,
  osmEmbedSrc,
  osmOpenSrc,
  parseCultureBody,
  phoneHref,
  relatedVenues,
  searchCulture,
  shareCulture,
  upcomingCultureEvents,
  venueForCulture,
} from '../lib/cultureVisuals'
import { eventStatus, formatEventDate, formatEventStamp } from '../lib/eventVisuals'
import { newsHref, publishedAt } from '../lib/newsVisuals'
import { COVERS } from '../lib/contentVisuals'
import './culture.css'

const NOTICE =
  'Bu platform portföy/demo amaçlıdır. Resmi kurum sistemi değildir; mekân bilgileri yayımlanmış belediye tesis sayfalarından referans alınmıştır. Konum işaretleri yaklaşıktır.'

const CONTINUE = [
  {
    to: '/etkinlikler',
    kicker: 'Sahne takvimi',
    title: 'Etkinlikler',
    hint: 'Bugün ve bu hafta programı keşfedin.',
  },
  {
    to: '/haberler',
    kicker: 'Gündem',
    title: 'Haberler',
    hint: 'Kültür ve sanat gelişmelerini okuyun.',
  },
  {
    to: '/faaliyetler',
    kicker: 'Yatırım',
    title: 'Faaliyetler',
    hint: 'Kültür mekânlarına dair çalışmaları inceleyin.',
  },
  {
    to: '/muhtarliklar',
    kicker: 'Mahalle',
    title: 'Muhtarlıklar',
    hint: 'Mekânın mahalle rehberine geçin.',
  },
] as const

function SearchIcon() {
  return (
    <svg className="ku-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function markForCategory(category?: string | null): string {
  if (category === 'Kütüphane') return '📖'
  if (category === 'Sahne' || category === 'Kültür merkezi') return '🎭'
  if (category === 'Müze') return '🏛️'
  if (category === 'Atölye' || category === 'Akademi') return '🎨'
  if (category === 'Sanat alanı') return '🖼️'
  return '📍'
}

export function CulturePage() {
  const [venues, setVenues] = useState<PortalContent[]>([])
  const [events, setEvents] = useState<PortalContent[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [place, setPlace] = useState('Tümü')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [venuePage, eventPage] = await Promise.all([
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=CultureVenue&pageSize=50'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Event&pageSize=50'),
        ])
        if (cancelled) return
        setVenues(venuePage.items)
        setEvents(eventPage.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Kültür mekânları yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const present = new Set(venues.map((item) => item.category).filter(Boolean) as string[])
    return ['Tümü', ...CULTURE_CATEGORIES.filter((label) => present.has(label))]
  }, [venues])

  const places = useMemo(() => {
    const present = [...new Set(venues.map((item) => item.location).filter(Boolean) as string[])]
    present.sort((a, b) => a.localeCompare(b, 'tr'))
    return ['Tümü', ...present]
  }, [venues])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return venues
      .filter((item) => (category === 'Tümü' ? true : item.category === category))
      .filter((item) => (place === 'Tümü' ? true : item.location === place))
      .filter((item) => searchCulture(item, needle))
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [venues, category, place, q])

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null
  const featured = filtered.find((item) => item.sortOrder === 1) ?? filtered[0] ?? null
  const rest = featured ? filtered.filter((item) => item.id !== featured.id) : []
  const coming = upcomingCultureEvents(venues, events)
  const route = CULTURE_ROUTE.map((slug) => venues.find((item) => item.slug === slug)).filter(Boolean) as PortalContent[]
  const mapVenue = selected ? venueForCulture(selected) : null

  const stats = {
    venues: venues.length,
    categories: new Set(venues.map((item) => item.category).filter(Boolean)).size,
    neighborhoods: new Set(venues.map((item) => item.location).filter(Boolean)).size,
    events: coming.length,
  }

  return (
    <PublicPage immersive className="pub--wide" title="Kültür & sanat">
      <div className="ku">
        <header className="ku-hero">
          <img src={COVERS.culture.src} alt="Avlu34 salon ve fuaye atmosferi — kültür rotası kapak görseli" />
          <span className="ku-hero-shade" aria-hidden />
          <div className="ku-hero-plate">
            <p className="ku-kicker">Kültür rotası</p>
            <h1>Kültür & sanat</h1>
            <p>Arnavutköy’de kültürün ve sanatın izini sür. Mekân, sahne, kütüphane ve atölyeyi tek haritada keşfet.</p>
          </div>
        </header>

        <div className="ku-pulse" aria-label="Kültür özeti">
          <div>
            <strong>{loading ? '—' : stats.venues}</strong>
            <span>Mekân</span>
          </div>
          <div>
            <strong>{loading ? '—' : stats.categories}</strong>
            <span>Tür</span>
          </div>
          <div>
            <strong>{loading ? '—' : stats.neighborhoods}</strong>
            <span>Mahalle</span>
          </div>
          <div>
            <strong>{loading ? '—' : stats.events}</strong>
            <span>Yaklaşan etkinlik</span>
          </div>
        </div>

        {coming.length > 0 ? (
          <section className="ku-week" aria-labelledby="ku-week-title">
            <header className="ku-section-head">
              <p>Bu hafta sahne</p>
              <h2 id="ku-week-title">Yaklaşan etkinlikler</h2>
            </header>
            <ol>
              {coming.slice(0, 4).map((event) => {
                const stamp = formatEventStamp(event.startsAtUtc)
                const host = cultureVenueForEvent(event, venues)
                return (
                  <li key={event.id}>
                    <Link to={`/etkinlikler/${event.id}`}>
                      <time dateTime={event.startsAtUtc ?? undefined}>
                        <strong>{stamp.day}</strong>
                        <span>{stamp.month}</span>
                      </time>
                      <div>
                        <em>{event.category ?? 'Program'}</em>
                        <strong>{event.title}</strong>
                        <span>{host?.title ?? event.location ?? 'Arnavutköy'}</span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}

        <div className="ku-toolbar">
          <p className="ku-count" aria-live="polite">
            {loading ? 'Mekânlar yükleniyor…' : (
              <>
                <strong>{filtered.length}</strong> mekân
              </>
            )}
          </p>
          <div className="field ku-search">
            <label htmlFor="ku-q">Kültür mekânı ara</label>
            <div className="ku-search-box">
              <SearchIcon />
              <input
                id="ku-q"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Kültür merkezi, kütüphane, mahalle veya etkinlik ara…"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="ku-filters">
          <div className="ku-chips" role="toolbar" aria-label="Mekân türleri">
            {categories.map((label) => (
              <button
                key={label}
                type="button"
                className={`ku-chip${category === label ? ' is-on' : ''}`}
                aria-pressed={category === label}
                onClick={() => setCategory(label)}
              >
                {label}
              </button>
            ))}
          </div>
          {places.length > 2 ? (
            <div className="ku-chips ku-chips--place" role="toolbar" aria-label="Mahalle">
              {places.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`ku-chip${place === label ? ' is-on' : ''}`}
                  aria-pressed={place === label}
                  onClick={() => setPlace(label)}
                >
                  {label === 'Tümü' ? 'Tüm mahalleler' : label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {!loading && featured ? (
          <Link to={cultureHref(featured)} className="ku-stage">
            <div className="ku-stage-media">
              <img src={coverForCulture(featured).src} alt={coverForCulture(featured).alt} />
            </div>
            <div className="ku-stage-copy">
              <span className="ku-label">{featured.category}</span>
              <h2>{featured.title}</h2>
              <p>{featured.summary}</p>
              <span className="ku-meta">{featured.location}</span>
              <span className="ku-go">Mekânı keşfet</span>
            </div>
          </Link>
        ) : null}

        {!loading && selected && mapVenue ? (
          <section className="ku-atlas" aria-labelledby="ku-map-title">
            <div className="ku-atlas-list">
              <header className="ku-section-head">
                <p>Harita</p>
                <h2 id="ku-map-title">Kültür haritası</h2>
              </header>
              <ul>
                {filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={item.id === selected.id ? 'is-on' : ''}
                      aria-pressed={item.id === selected.id}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span>{markForCategory(item.category)} {item.category}</span>
                      <strong>{item.title}</strong>
                      <em>{item.location}</em>
                    </button>
                    <Link to={cultureHref(item)}>Keşfet →</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ku-atlas-map">
              <iframe
                key={selected.id}
                title={`${mapVenue.label} haritası`}
                src={osmEmbedSrc(mapVenue)}
                loading="lazy"
              />
              <a href={osmOpenSrc(mapVenue)} target="_blank" rel="noreferrer">
                {mapVenue.label} — OpenStreetMap’te aç
              </a>
            </div>
          </section>
        ) : null}

        {!loading && rest.length > 0 ? (
          <section className="ku-catalog" aria-labelledby="ku-catalog-title">
            <header className="ku-section-head">
              <p>Katalog</p>
              <h2 id="ku-catalog-title">Mekânlar</h2>
            </header>
            <div className="ku-grid">
              {rest.map((item) => (
                <VenueCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && route.length >= 2 ? (
          <section className="ku-route" aria-labelledby="ku-route-title">
            <header className="ku-section-head">
              <p>Üç durak</p>
              <h2 id="ku-route-title">Kültür rotası</h2>
            </header>
            <ol>
              {route.map((item, index) => (
                <li key={item.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <Link to={cultureHref(item)}>
                    <strong>{item.title}</strong>
                    <em>{item.location} · {item.category}</em>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="ku-empty">
            <strong>Aradığınız kritere uygun kültür mekânı bulunamadı.</strong>
            <p>Türü değiştirin veya aramayı sadeleştirin.</p>
          </div>
        ) : null}

        <section className="ku-continue" aria-labelledby="ku-continue-title">
          <header className="ku-section-head">
            <p>Kültürün izinde</p>
            <h2 id="ku-continue-title">Keşfetmeye devam et</h2>
          </header>
          <div className="ku-continue-grid">
            {CONTINUE.map((item) => (
              <Link key={item.to} to={item.to} className="ku-door">
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
                <p>{item.hint}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="ku-notice">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}

function VenueCard({ item }: { item: PortalContent }) {
  const cover = coverForCulture(item)
  return (
    <Link to={cultureHref(item)} className="ku-card">
      <div className="ku-card-media">
        <img src={cover.src} alt={cover.alt} loading="lazy" />
      </div>
      <div className="ku-card-copy">
        <span className="ku-label">{item.category}</span>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <span className="ku-meta">{item.location}</span>
        <span className="ku-go">Keşfet</span>
      </div>
    </Link>
  )
}

export function CultureDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<PortalContent | null>(null)
  const [pool, setPool] = useState<PortalContent[]>([])
  const [events, setEvents] = useState<PortalContent[]>([])
  const [news, setNews] = useState<PortalContent[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shareNote, setShareNote] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setItem(null)
    setError(null)
    void (async () => {
      try {
        const path = isCultureId(id) ? `/api/v1/portal/${id}` : `/api/v1/portal/by-slug/${id}`
        const [venue, venuePage, eventPage, newsPage, mahalle] = await Promise.all([
          apiFetch<PortalContent>(path),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=CultureVenue&pageSize=50'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Event&pageSize=50'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=News&pageSize=80'),
          apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
        ])
        if (cancelled) return
        setItem(venue)
        setPool(venuePage.items)
        setEvents(eventPage.items)
        setNews(newsPage.items)
        setNeighborhoods(mahalle)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Mekân yüklenemedi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const parsed = item ? parseCultureBody(item.body) : null
  const cover = item ? coverForCulture(item) : null
  const venue = item ? venueForCulture(item) : null
  const related = item ? relatedVenues(item, pool) : []
  const venueEvents = item ? eventsForVenue(item, events) : []
  const venueNews = item ? newsForVenue(item, news) : []
  const mahalle = item ? neighborhoodForVenue(item, neighborhoods) : null
  const gallery = item ? cultureGallery(item) : []
  const tel = parsed?.extras.phone ? phoneHref(parsed.extras.phone) : null

  async function onShare() {
    if (!item) return
    try {
      await shareCulture(item.title, cultureHref(item))
      setShareNote('Bağlantı kopyalandı.')
    } catch {
      setShareNote(null)
    }
  }

  return (
    <PublicPage immersive className="pub--wide" title={item?.title ?? 'Kültür mekânı'}>
      <div className="ku kud">
        <Link className="ku-back" to="/kultur">
          ← Kültür rotasına dön
        </Link>

        {error ? <div className="error-box">{error}</div> : null}
        {!item && !error ? <p className="ku-notice">Mekân açılıyor…</p> : null}

        {item && parsed && cover && venue ? (
          <>
            <header className="kud-head">
              <span className="ku-label">{item.category}</span>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
            </header>

            <figure className="kud-cover">
              <img src={cover.src} alt={cover.alt} />
            </figure>

            <div className="kud-layout">
              <article className="kud-prose">
                {parsed.paragraphs.map((block, index) =>
                  block.startsWith('## ') ? (
                    <h2 key={`${block}-${index}`}>{block.slice(3)}</h2>
                  ) : (
                    <p key={`${block.slice(0, 28)}-${index}`}>{block}</p>
                  ),
                )}

                <section className="kud-gallery" aria-labelledby="kud-gallery-title">
                  <h2 id="kud-gallery-title">Galeri</h2>
                  <div>
                    {gallery.map((image) => (
                      <figure key={image.src}>
                        <img src={image.src} alt={image.alt} loading="lazy" />
                      </figure>
                    ))}
                  </div>
                </section>
              </article>

              <aside className="kud-label">
                <p>Mekân etiketi</p>
                <dl>
                  {parsed.extras.address ? (
                    <div>
                      <dt>Adres</dt>
                      <dd>{parsed.extras.address}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Mahalle</dt>
                    <dd>
                      {mahalle ? <Link to={`/muhtarliklar/${mahalle.id}`}>{mahalle.name}</Link> : item.location ?? '—'}
                    </dd>
                  </div>
                  {parsed.extras.phone ? (
                    <div>
                      <dt>Telefon</dt>
                      <dd>{tel ? <a href={tel}>{parsed.extras.phone}</a> : parsed.extras.phone}</dd>
                    </div>
                  ) : null}
                  {parsed.extras.hours ? (
                    <div>
                      <dt>Çalışma saati</dt>
                      <dd>{parsed.extras.hours}</dd>
                    </div>
                  ) : null}
                  {parsed.extras.services.length > 0 ? (
                    <div>
                      <dt>Hizmet</dt>
                      <dd>{parsed.extras.services.join(', ')}</dd>
                    </div>
                  ) : null}
                  {parsed.extras.source ? (
                    <div>
                      <dt>Kaynak</dt>
                      <dd>{parsed.extras.source}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="ku-map">
                  <iframe title={`${venue.label} haritası`} src={osmEmbedSrc(venue)} loading="lazy" />
                </div>
                <a href={osmOpenSrc(venue)} target="_blank" rel="noreferrer">
                  OpenStreetMap’te aç →
                </a>
                <div className="kud-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => void onShare()}>
                    Paylaş
                  </button>
                  <Link className="btn btn-ghost" to="/kultur">
                    Geri dön
                  </Link>
                </div>
                {shareNote ? <p className="kud-share">{shareNote}</p> : null}
              </aside>
            </div>

            {venueEvents.length > 0 ? (
              <section className="ku-week" aria-labelledby="kud-events-title">
                <header className="ku-section-head">
                  <p>Bu mekânda</p>
                  <h2 id="kud-events-title">Yaklaşan etkinlikler</h2>
                </header>
                <ol>
                  {venueEvents.map((event) => {
                    const stamp = formatEventStamp(event.startsAtUtc)
                    const status = eventStatus(event)
                    return (
                      <li key={event.id}>
                        <Link to={`/etkinlikler/${event.id}`}>
                          <time dateTime={event.startsAtUtc ?? undefined}>
                            <strong>{stamp.day}</strong>
                            <span>{stamp.month}</span>
                          </time>
                          <div>
                            <em>{status === 'past' ? 'Geçmiş program' : event.category}</em>
                            <strong>{event.title}</strong>
                            <span>{formatEventDate(event.startsAtUtc)}</span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ) : null}

            {venueNews.length > 0 ? (
              <section className="kud-news" aria-labelledby="kud-news-title">
                <header className="ku-section-head">
                  <p>Gündem</p>
                  <h2 id="kud-news-title">Bu mekânla ilgili haberler</h2>
                </header>
                <ul>
                  {venueNews.map((story) => (
                    <li key={story.id}>
                      <Link to={newsHref(story)}>
                        <span>{story.category}</span>
                        <strong>{story.title}</strong>
                        <em>{new Date(publishedAt(story)).toLocaleDateString('tr-TR')}</em>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {related.length > 0 ? (
              <section className="ku-catalog" aria-labelledby="kud-related-title">
                <header className="ku-section-head">
                  <p>Yakın mekân</p>
                  <h2 id="kud-related-title">İlgili tesisler</h2>
                </header>
                <div className="ku-grid">
                  {related.map((entry) => (
                    <VenueCard key={entry.id} item={entry} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="ku-continue" aria-labelledby="kud-continue-title">
              <header className="ku-section-head">
                <p>Kültürün izinde</p>
                <h2 id="kud-continue-title">Keşfetmeye devam et</h2>
              </header>
              <div className="ku-continue-grid">
                {CONTINUE.map((entry) => (
                  <Link key={entry.to} to={entry.to} className="ku-door">
                    <span>{entry.kicker}</span>
                    <strong>{entry.title}</strong>
                    <p>{entry.hint}</p>
                  </Link>
                ))}
              </div>
            </section>

            <p className="ku-notice">{NOTICE}</p>
          </>
        ) : null}
      </div>
    </PublicPage>
  )
}
