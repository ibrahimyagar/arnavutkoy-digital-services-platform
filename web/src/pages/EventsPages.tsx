import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PublicPage, PublicRelated } from '../components/ui/PublicPage'
import {
  apiFetch,
  type EventRegistration,
  type EventRegistrationStatus,
  type Paginated,
  type PortalContent,
} from '../lib/api'
import { RELATED } from '../lib/contentVisuals'
import {
  EVENT_CATEGORIES,
  coverForEvent,
  downloadEventIcs,
  eventStatus,
  formatEventClock,
  formatEventDate,
  formatEventStamp,
  formatEventTimeRange,
  eventAgenda,
  googleCalendarUrl,
  hasParticipationNotes,
  osmEmbedSrc,
  osmOpenSrc,
  parseEventBody,
  relatedServiceHref,
  shareEvent,
  venueForLocation,
  type EventExtras,
} from '../lib/eventVisuals'
import { loginPath } from '../lib/returnUrl'
import { cultureHref, cultureVenueForEvent } from '../lib/cultureVisuals'
import './events.css'

function SearchIcon() {
  return (
    <svg className="ev-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function statusLabel(status: ReturnType<typeof eventStatus>): { text: string; tone: string } {
  if (status === 'live') return { text: 'Devam ediyor', tone: 'ev-pill--live' }
  if (status === 'past') return { text: 'Tamamlandı', tone: 'ev-pill--past' }
  return { text: 'Yaklaşan', tone: '' }
}

async function loadMyRegistrations(): Promise<EventRegistration[]> {
  return apiFetch<EventRegistration[]>('/api/v1/event-registrations/mine', {}, true)
}

export function EventsPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<PortalContent[]>([])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set())
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Event&pageSize=50')
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Etkinlikler yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setRegisteredIds(new Set())
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const mine = await loadMyRegistrations()
        if (!cancelled) {
          setRegisteredIds(new Set(mine.filter((row) => row.status === 'Registered').map((row) => row.eventId)))
        }
      } catch {
        if (!cancelled) setRegisteredIds(new Set())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return items
      .filter((item) => (category === 'Tümü' ? true : item.category === category))
      .filter((item) => {
        if (!needle) return true
        return (
          item.title.toLocaleLowerCase('tr-TR').includes(needle) ||
          item.summary.toLocaleLowerCase('tr-TR').includes(needle) ||
          (item.location ?? '').toLocaleLowerCase('tr-TR').includes(needle)
        )
      })
      .slice()
      .sort((a, b) => {
        const aTime = a.startsAtUtc ? new Date(a.startsAtUtc).getTime() : 0
        const bTime = b.startsAtUtc ? new Date(b.startsAtUtc).getTime() : 0
        return aTime - bTime
      })
  }, [items, category, q])

  const featured = filtered.find((item) => eventStatus(item) !== 'past') ?? filtered[0] ?? null
  const rest = featured ? filtered.filter((item) => item.id !== featured.id) : []
  const upcomingCount = items.filter((item) => eventStatus(item) !== 'past').length

  return (
    <PublicPage
      eyebrow="Takvim"
      title="Etkinlikler"
      lead="Kültür, spor, eğitim ve açık hava programı. Tarih, yer ve katılım için etkinliği açın; kayıt hesabınıza işlenir."
    >
      <div className="ev">
        <div className="ev-toolbar">
          <div className="ev-toolbar-top">
            <p className="ev-count" aria-live="polite">
              {loading ? (
                'Etkinlikler yükleniyor…'
              ) : (
                <>
                  <strong>{filtered.length}</strong> etkinlik
                  {upcomingCount > 0 ? ` · ${upcomingCount} yaklaşan` : null}
                </>
              )}
            </p>
            <div className="ev-toolbar-tools">
              <Link className="ev-mine-link" to={isAuthenticated ? '/etkinliklerim' : loginPath('/etkinliklerim')}>
                Kayıtlarım
              </Link>
              <div className="field ev-search">
                <label htmlFor="ev-q">Etkinlik ara</label>
                <div className="ev-search-box">
                  <SearchIcon />
                  <input
                    id="ev-q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Konum, başlık, kültür…"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="ev-chips" role="toolbar" aria-label="Etkinlik kategorileri">
            {['Tümü', ...EVENT_CATEGORIES].map((label) => (
              <button
                key={label}
                type="button"
                className={`ev-chip${category === label ? ' is-on' : ''}`}
                aria-pressed={category === label}
                onClick={() => setCategory(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {loading ? (
          <div className="ev" aria-hidden>
            <div className="ev-skel ev-skel--poster" />
            <div className="ev-grid">
              <div className="ev-skel" />
              <div className="ev-skel" />
              <div className="ev-skel" />
            </div>
          </div>
        ) : null}

        {!loading && featured ? (
          <>
            <FeaturedEvent item={featured} registered={registeredIds.has(featured.id)} />
            {rest.length > 0 ? (
              <section aria-label="Diğer etkinlikler">
                <div className="ev-board-head">
                  <h2>Program</h2>
                </div>
                <div className="ev-grid">
                  {rest.map((item) => (
                    <EventCard key={item.id} item={item} registered={registeredIds.has(item.id)} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="ev-empty">
            <strong>Eşleşen etkinlik yok</strong>
            <p>Kategoriyi veya aramayı değiştirerek tekrar deneyin.</p>
          </div>
        ) : null}
      </div>
      <PublicRelated items={RELATED.media} />
    </PublicPage>
  )
}

function FeaturedEvent({ item, registered }: { item: PortalContent; registered: boolean }) {
  const cover = coverForEvent(item)
  const status = statusLabel(eventStatus(item))

  return (
    <Link to={`/etkinlikler/${item.id}`} className="ev-poster">
      <img src={cover.src} alt="" />
      <span className="ev-poster-shade" aria-hidden />
      <div className="ev-poster-copy">
        <div className="ev-kicker">
          <span className="ev-tag">{status.text}</span>
          {item.category ? <span className="ev-tag ev-tag--ghost">{item.category}</span> : null}
          {registered ? <span className="ev-tag ev-tag--ghost">Kayıtlısınız</span> : null}
        </div>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
        <div className="ev-poster-meta">
          <span>{formatEventDate(item.startsAtUtc)}</span>
          <span>{formatEventTimeRange(item.startsAtUtc, item.endsAtUtc)}</span>
          {item.location ? <span>{item.location}</span> : null}
        </div>
        <span className="ev-poster-go">{registered ? 'Kaydı yönet →' : 'Kayıt ve detay →'}</span>
      </div>
    </Link>
  )
}

function EventCard({ item, registered }: { item: PortalContent; registered: boolean }) {
  const cover = coverForEvent(item)
  const stamp = formatEventStamp(item.startsAtUtc)
  const status = statusLabel(eventStatus(item))

  return (
    <Link to={`/etkinlikler/${item.id}`} className="ev-card">
      <div className="ev-card-media">
        <img src={cover.src} alt="" />
        <time className="ev-stamp" dateTime={item.startsAtUtc ?? undefined}>
          <b>{stamp.day}</b>
          <span>{stamp.month}</span>
        </time>
      </div>
      <div className="ev-card-body">
        <div className="ev-kicker">
          {item.category ? <span className="ev-pill">{item.category}</span> : null}
          <span className={`ev-pill ${status.tone}`.trim()}>{status.text}</span>
          {registered ? <span className="ev-pill ev-pill--live">Kayıtlı</span> : null}
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="ev-card-meta">
          <span>{formatEventClock(item.startsAtUtc)}</span>
          {item.location ? <span>{item.location}</span> : null}
        </div>
      </div>
    </Link>
  )
}

export function EventsDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [item, setItem] = useState<PortalContent | null>(null)
  const [related, setRelated] = useState<PortalContent[]>([])
  const [venues, setVenues] = useState<PortalContent[]>([])
  const [status, setStatus] = useState<EventRegistrationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  async function refreshStatus(eventId: string) {
    const next = await apiFetch<EventRegistrationStatus>(`/api/v1/event-registrations/status/${eventId}`)
    if (!isAuthenticated) {
      setStatus(next)
      return
    }
    try {
      const mine = await loadMyRegistrations()
      const row = mine.find((entry) => entry.eventId === eventId)
      const registered = row?.status === 'Registered'
      setStatus({
        ...next,
        isRegistered: registered,
        registrationId: row?.id ?? next.registrationId,
        status: row?.status ?? next.status,
      })
    } catch {
      setStatus(next)
    }
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setItem(null)
    setError(null)
    setNotice(null)
    setConfirmCancel(false)
    void (async () => {
      try {
        const [detail, page, venuePage] = await Promise.all([
          apiFetch<PortalContent>(`/api/v1/portal/${id}`),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Event&pageSize=50'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=CultureVenue&pageSize=50'),
        ])
        if (cancelled) return
        setItem(detail)
        setVenues(venuePage.items)
        setRelated(
          page.items
            .filter((entry) => entry.id !== detail.id)
            .sort((a, b) => {
              const same = Number(b.category === detail.category) - Number(a.category === detail.category)
              if (same !== 0) return same
              return (a.startsAtUtc ? new Date(a.startsAtUtc).getTime() : 0) -
                (b.startsAtUtc ? new Date(b.startsAtUtc).getTime() : 0)
            })
            .slice(0, 4),
        )
        try {
          await refreshStatus(detail.id)
        } catch {
          if (!cancelled) setStatus(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Etkinlik bulunamadı.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isAuthenticated])

  const cover = item ? coverForEvent(item) : null
  const parsed = item ? parseEventBody(item.body) : null
  const venue = item ? venueForLocation(item.location) : null
  const cultureVenue = item ? cultureVenueForEvent(item, venues) : null
  const relatedService = item ? relatedServiceHref(item) : null
  const stamp = item ? statusLabel(eventStatus(item)) : null
  const agenda = item && parsed ? eventAgenda(item, parsed.extras) : []
  const quotaFilled =
    status?.quota && status.quota > 0
      ? Math.min(100, Math.round((status.registeredCount / status.quota) * 100))
      : null

  async function onRegister() {
    if (!item) return
    if (!isAuthenticated) {
      navigate(loginPath(location.pathname))
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await apiFetch('/api/v1/event-registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId: item.id }),
      }, true)
      await refreshStatus(item.id)
      setNotice('Kaydınız alındı. Etkinlik, Kayıtlarım sayfanızda görünür.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt tamamlanamadı.')
    } finally {
      setBusy(false)
    }
  }

  async function onCancel() {
    if (!item) return
    if (!confirmCancel) {
      setConfirmCancel(true)
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await apiFetch(`/api/v1/event-registrations/${item.id}/cancel`, { method: 'POST' }, true)
      await refreshStatus(item.id)
      setConfirmCancel(false)
      setNotice('Kaydınız iptal edildi. İsterseniz yeniden kayıt olabilirsiniz.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal tamamlanamadı.')
    } finally {
      setBusy(false)
    }
  }

  async function onShare() {
    if (!item) return
    setError(null)
    try {
      const result = await shareEvent(item)
      setNotice(result === 'copied' ? 'Etkinlik bağlantısı kopyalandı.' : 'Paylaşım penceresi açıldı.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setNotice(`Bağlantı: ${window.location.href}`)
    }
  }

  function onCalendar() {
    if (!item) return
    downloadEventIcs(item)
    setNotice('Takvim dosyası (.ics) indirildi. Google veya Outlook ile de ekleyebilirsiniz.')
  }

  return (
    <PublicPage immersive className="pub--wide" title={item?.title ?? 'Etkinlik'}>
      <p className="evd-nav">
        <Link to="/etkinlikler">← Tüm etkinlikler</Link>
        <span aria-hidden>·</span>
        <Link to={isAuthenticated ? '/etkinliklerim' : loginPath('/etkinliklerim')}>Kayıtlarım</Link>
      </p>

      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {notice ? <div className="success-box" role="status">{notice}</div> : null}
      {!item && !error ? (
        <>
          <h1 className="sr-only">Etkinlik</h1>
          <div className="ev-skel ev-skel--poster" aria-busy="true" />
        </>
      ) : null}

      {item && cover && parsed && venue && stamp ? (
        <div className="evd">
          <div className="evd-hero">
            <img src={cover.src} alt={cover.alt} />
            <span className="evd-hero-shade" aria-hidden />
            <div className="evd-hero-copy">
              <div className="ev-kicker">
                {item.category ? <span className="ev-tag">{item.category}</span> : null}
                <span className="ev-tag ev-tag--ghost">{stamp.text}</span>
                {parsed.extras.fee ? <span className="ev-tag ev-tag--ghost">{parsed.extras.fee}</span> : null}
                {status?.isRegistered ? <span className="ev-tag">Kayıtlısınız</span> : null}
              </div>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
              <ul className="evd-hero-meta">
                <li>
                  <MetaIcon name="cal" />
                  {formatEventDate(item.startsAtUtc)}
                </li>
                <li>
                  <MetaIcon name="clock" />
                  {formatEventTimeRange(item.startsAtUtc, item.endsAtUtc)}
                </li>
                <li>
                  <MetaIcon name="pin" />
                  {item.location ?? venue.label}
                </li>
              </ul>
            </div>
          </div>

          <div className="evd-facts">
            <div>
              <span>Tarih</span>
              <strong>{formatEventDate(item.startsAtUtc)}</strong>
            </div>
            <div>
              <span>Saat</span>
              <strong>{formatEventTimeRange(item.startsAtUtc, item.endsAtUtc)}</strong>
            </div>
            <div>
              <span>Konum</span>
              <strong>{item.location ?? venue.label}</strong>
            </div>
            <div>
              <span>Kontenjan</span>
              <strong>
                {status?.quota
                  ? `${status.registeredCount} / ${status.quota}`
                  : status
                    ? `${status.registeredCount} kayıt`
                    : parsed.extras.quota ?? '—'}
              </strong>
            </div>
          </div>

          <div className="evd-layout">
            <div className="evd-main">
              <article className="evd-prose">
                <h2>Hakkında</h2>
                {parsed.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </article>

              {agenda.length > 0 ? (
                <section className="evd-agenda" aria-labelledby="evd-agenda-title">
                  <h2 id="evd-agenda-title">Program</h2>
                  <ol>
                    {agenda.map((row) => (
                      <li key={`${row.time}-${row.label}`}>
                        {row.time ? <time>{row.time}</time> : null}
                        <span>{row.label}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {hasParticipationNotes(parsed.extras) ? (
                <section className="evd-notes" aria-labelledby="evd-notes-title">
                  <h2 id="evd-notes-title">Katılım notları</h2>
                  <ExtraBlock extras={parsed.extras} />
                </section>
              ) : null}

              <section className="evd-venue" aria-labelledby="evd-venue-title">
                <div className="evd-venue-copy">
                  <h2 id="evd-venue-title">Konum</h2>
                  <p>{item.location ?? venue.label}</p>
                  {cultureVenue ? (
                    <p>
                      <Link to={cultureHref(cultureVenue)}>Etkinlik mekânı · {cultureVenue.title} →</Link>
                    </p>
                  ) : null}
                  <a href={osmOpenSrc(venue)} target="_blank" rel="noreferrer">
                    OpenStreetMap’te aç →
                  </a>
                </div>
                <div className="ev-map">
                  <iframe
                    title={`${venue.label} haritası`}
                    src={osmEmbedSrc(venue)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            </div>

            <aside className={`evd-ticket${status?.isRegistered ? ' is-in' : ''}`}>
              <p className="evd-ticket-kicker">Katılım</p>
              <h2>{status?.isRegistered ? 'Kaydınız alındı' : 'Etkinliğe kayıt'}</h2>
              <ul className="evd-ticket-meta">
                <li>
                  <MetaIcon name="cal" />
                  {formatEventDate(item.startsAtUtc)}
                  {' · '}
                  {formatEventTimeRange(item.startsAtUtc, item.endsAtUtc)}
                </li>
                <li>
                  <MetaIcon name="pin" />
                  {item.location ?? venue.label}
                </li>
              </ul>
              {status ? (
                <div className="evd-seats">
                  <div className="evd-seats-row">
                    <span>
                      {status.quota
                        ? `${status.registeredCount} / ${status.quota} kayıt`
                        : `${status.registeredCount} kayıt`}
                    </span>
                    {status.remaining != null ? <em>{status.remaining} yer</em> : null}
                  </div>
                  {quotaFilled != null ? (
                    <div className="evd-meter" aria-hidden>
                      <span style={{ width: `${quotaFilled}%` }} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="ev-actions">
                {status?.isRegistered ? (
                  <>
                    <p className="ev-registered">Bu etkinlik, Kayıtlarım listesinde görünür.</p>
                    <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onCancel()}>
                      {confirmCancel ? (busy ? 'İptal ediliyor…' : 'İptali onayla') : 'Kaydı iptal et'}
                    </button>
                    {confirmCancel ? (
                      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirmCancel(false)}>
                        Vazgeç
                      </button>
                    ) : null}
                  </>
                ) : (
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void onRegister()}>
                    {busy ? 'Kaydediliyor…' : isAuthenticated ? 'Kayıt ol' : 'Giriş yapıp kayıt ol'}
                  </button>
                )}
                <div className="evd-btn-row">
                  <button type="button" className="btn btn-ghost" onClick={onCalendar}>
                    Takvime ekle
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => void onShare()}>
                    Paylaş
                  </button>
                </div>
                <div className="ev-cal-links">
                  <a href={googleCalendarUrl(item)} target="_blank" rel="noreferrer">
                    Google Takvim
                  </a>
                  <Link to={isAuthenticated ? '/etkinliklerim' : loginPath('/etkinliklerim')}>Kayıtlarım</Link>
                </div>
                {relatedService ? (
                  <Link className="ev-related-service" to={relatedService.to}>
                    {relatedService.label} →
                  </Link>
                ) : null}
              </div>
            </aside>
          </div>

          {related.length > 0 ? (
            <section className="evd-more" aria-labelledby="evd-more-title">
              <h2 id="evd-more-title">Diğer etkinlikler</h2>
              <div className="evd-more-grid">
                {related.slice(0, 3).map((entry) => {
                  const stampCard = formatEventStamp(entry.startsAtUtc)
                  return (
                    <Link key={entry.id} to={`/etkinlikler/${entry.id}`} className="evd-more-card">
                      <time dateTime={entry.startsAtUtc ?? undefined}>
                        <b>{stampCard.day}</b>
                        <span>{stampCard.month}</span>
                      </time>
                      <div>
                        <strong>{entry.title}</strong>
                        <span>
                          {formatEventClock(entry.startsAtUtc)}
                          {entry.location ? ` · ${entry.location}` : ''}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : null}

          <div className="notice">
            Kurgusal demo etkinliğidir; resmi Arnavutköy Belediyesi programı değildir.
          </div>
          <PublicRelated items={RELATED.media} />
        </div>
      ) : null}
    </PublicPage>
  )
}

function MetaIcon({ name }: { name: 'cal' | 'clock' | 'pin' }) {
  const common = {
    viewBox: '0 0 16 16',
    width: 14,
    height: 14,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    'aria-hidden': true as const,
  }
  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="5.25" />
        <path d="M8 5.2V8l2 1.4" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'pin') {
    return (
      <svg {...common}>
        <path d="M8 14s4.2-3.4 4.2-7A4.2 4.2 0 0 0 8 2.8 4.2 4.2 0 0 0 3.8 7c0 3.6 4.2 7 4.2 7z" />
        <circle cx="8" cy="7" r="1.35" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="2.2" y="3.4" width="11.6" height="10.2" rx="1.4" />
      <path d="M2.2 6.6h11.6M5.4 2.4v2.4M10.6 2.4v2.4" strokeLinecap="round" />
    </svg>
  )
}

export function MyEventsPage() {
  const { isAuthenticated } = useAuth()
  const [rows, setRows] = useState<EventRegistration[]>([])
  const [filter, setFilter] = useState<'Registered' | 'Cancelled' | 'all'>('Registered')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    const mine = await loadMyRegistrations()
    setRows(mine)
  }

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    void (async () => {
      try {
        const mine = await loadMyRegistrations()
        if (!cancelled) setRows(mine)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Kayıtlar yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const visible = rows.filter((row) => (filter === 'all' ? true : row.status === filter))

  async function onCancel(row: EventRegistration) {
    setBusyId(row.eventId)
    setError(null)
    setNotice(null)
    try {
      await apiFetch(`/api/v1/event-registrations/${row.eventId}/cancel`, { method: 'POST' }, true)
      await refresh()
      setNotice(`“${row.eventTitle}” kaydı iptal edildi.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal tamamlanamadı.')
    } finally {
      setBusyId(null)
    }
  }

  async function onRegister(row: EventRegistration) {
    setBusyId(row.eventId)
    setError(null)
    setNotice(null)
    try {
      await apiFetch('/api/v1/event-registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId: row.eventId }),
      }, true)
      await refresh()
      setFilter('Registered')
      setNotice(`“${row.eventTitle}” için yeniden kayıt oldunuz.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt tamamlanamadı.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PublicPage
      eyebrow="Hesabım"
      title="Etkinlik kayıtlarım"
      lead="Kayıt olduğunuz programlar burada tutulur. İptal ve yeniden kayıt aynı kaydı günceller."
    >
      <p className="ev-nav">
        <Link to="/etkinlikler">← Etkinlik takvimi</Link>
      </p>

      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {notice ? <div className="success-box" role="status">{notice}</div> : null}

      <div className="ev-chips" role="toolbar" aria-label="Kayıt durumu">
        {(
          [
            ['Registered', 'Aktif kayıtlar'],
            ['Cancelled', 'İptal edilenler'],
            ['all', 'Tümü'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`ev-chip${filter === value ? ' is-on' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="ev-skel" aria-busy="true" /> : null}

      {!loading && visible.length === 0 ? (
        <div className="ev-empty">
          <strong>{filter === 'Registered' ? 'Aktif kaydınız yok' : 'Kayıt bulunamadı'}</strong>
          <p>
            Takvimden bir etkinlik seçip <Link to="/etkinlikler">kayıt olabilirsiniz</Link>.
          </p>
        </div>
      ) : null}

      <div className="ev-mine-list">
        {visible.map((row) => {
          const content = registrationAsContent(row)
          const stamp = statusLabel(eventStatus(content))
          const busy = busyId === row.eventId
          return (
            <article key={row.id} className="ev-mine-card">
              <div>
                <div className="ev-kicker">
                  {row.eventCategory ? <span className="ev-pill">{row.eventCategory}</span> : null}
                  <span className={`ev-pill ${stamp.tone}`.trim()}>{stamp.text}</span>
                  <span className={`ev-pill${row.status === 'Registered' ? ' ev-pill--live' : ''}`}>
                    {row.status === 'Registered' ? 'Kayıtlı' : 'İptal'}
                  </span>
                </div>
                <h2>{row.eventTitle}</h2>
                <p>
                  {formatEventDate(row.startsAtUtc)} · {formatEventTimeRange(row.startsAtUtc, row.endsAtUtc)}
                  {row.eventLocation ? ` · ${row.eventLocation}` : ''}
                </p>
              </div>
              <div className="ev-mine-actions">
                <Link className="btn btn-ghost" to={`/etkinlikler/${row.eventId}`}>
                  Detayları gör
                </Link>
                <button type="button" className="btn btn-ghost" onClick={() => downloadEventIcs(content)}>
                  Takvime ekle
                </button>
                {row.status === 'Registered' ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onCancel(row)}>
                    {busy ? 'İptal ediliyor…' : 'Kaydı iptal et'}
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void onRegister(row)}>
                    {busy ? 'Kaydediliyor…' : 'Yeniden kayıt ol'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </PublicPage>
  )
}

function registrationAsContent(row: EventRegistration): PortalContent {
  return {
    id: row.eventId,
    kind: 'Event',
    title: row.eventTitle,
    summary: row.eventTitle,
    body: '',
    slug: '',
    location: row.eventLocation,
    category: row.eventCategory,
    startsAtUtc: row.startsAtUtc,
    endsAtUtc: row.endsAtUtc,
    sortOrder: 0,
    createdAtUtc: row.registeredAtUtc,
  }
}

function ExtraBlock({ extras }: { extras: EventExtras }) {
  const rows = [
    extras.fee ? { label: 'Ücret', value: extras.fee } : null,
    extras.signup ? { label: 'Katılım', value: extras.signup } : null,
    extras.audience ? { label: 'Yaş / kitle', value: extras.audience } : null,
    extras.quota ? { label: 'Kontenjan', value: extras.quota } : null,
  ].filter((row): row is { label: string; value: string } => row !== null)

  return (
    <dl>
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
