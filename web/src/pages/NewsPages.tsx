import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage } from '../components/ui/PublicPage'
import { apiFetch, type Announcement, type Paginated, type PortalContent } from '../lib/api'
import {
  NEWS_CATEGORIES,
  coverForNews,
  formatNewsDate,
  formatNewsStamp,
  isFreshNews,
  isNewNews,
  isNewsId,
  matchAnnouncement,
  newsGallery,
  newsHref,
  newsMonthKey,
  newsMonthLabel,
  parseNewsBody,
  pickLeadNews,
  publishedAt,
  readingMinutes,
  relatedNews,
  searchNews,
  shareNews,
} from '../lib/newsVisuals'
import { cultureHref, cultureVenueForNews } from '../lib/cultureVisuals'
import './news.css'

const NOTICE =
  'Bu platform portföy/demo amaçlıdır. İçerikler resmi belediye sistemi değildir; haberler yayımlanmış kurum kaynaklarından özetlenmiştir.'

const CONTINUE = [
  {
    to: '/duyurular',
    kicker: 'Resmî bildirim',
    title: 'Duyurular',
    hint: 'Yol çalışması, başvuru günü ve sistem notlarını takip edin.',
  },
  {
    to: '/etkinlikler',
    kicker: 'Takvim',
    title: 'Etkinlikler',
    hint: 'Sahne, spor ve açık hava programını keşfedin.',
  },
  {
    to: '/faaliyetler',
    kicker: 'Saha',
    title: 'Faaliyetler',
    hint: 'Park, yol ve mahalle yatırımlarının dosyasını inceleyin.',
  },
] as const

function SearchIcon() {
  return (
    <svg className="nw-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function sortByPublished(items: PortalContent[]): PortalContent[] {
  return items.slice().sort((a, b) => publishedAt(b).getTime() - publishedAt(a).getTime())
}

function NewsBadge({ item }: { item: PortalContent }) {
  if (item.sortOrder === 1) return <span className="nw-flag nw-flag--lead">Öne çıkan</span>
  if (isNewNews(item)) return <span className="nw-flag nw-flag--new">Yeni</span>
  if (isFreshNews(item)) return <span className="nw-flag">Güncel</span>
  return null
}

export function NewsPage() {
  const [items, setItems] = useState<PortalContent[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [month, setMonth] = useState<string | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=News&pageSize=80')
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Haberler yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const present = new Set(items.map((item) => item.category).filter(Boolean) as string[])
    return ['Tümü', ...NEWS_CATEGORIES.filter((label) => present.has(label))]
  }, [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return sortByPublished(
      items
        .filter((item) => (category === 'Tümü' ? true : item.category === category))
        .filter((item) => (month ? newsMonthKey(publishedAt(item)) === month : true))
        .filter((item) => searchNews(item, needle)),
    )
  }, [items, category, q, month])

  const browsing = q.trim().length === 0 && category === 'Tümü' && !month
  const lead = browsing ? pickLeadNews(sortByPublished(items)) : filtered[0] ?? null
  const afterLead = lead ? filtered.filter((item) => item.id !== lead.id) : filtered
  const mosaicMain = afterLead[0] ?? null
  const mosaicSide = afterLead.slice(1, 3)
  const latest = afterLead.slice(browsing ? 3 : 1, browsing ? 9 : 7)
  const archive = afterLead.slice(browsing ? 9 : 7)
  const archiveVisible = archiveOpen ? archive : archive.slice(0, 6)

  const months = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>()
    for (const item of sortByPublished(items)) {
      const date = publishedAt(item)
      const key = newsMonthKey(date)
      const current = groups.get(key)
      if (current) current.count += 1
      else groups.set(key, { label: newsMonthLabel(date), count: 1 })
    }
    return [...groups.entries()].map(([key, value]) => ({ key, ...value }))
  }, [items])

  const stats = {
    total: items.length,
    categories: new Set(items.map((item) => item.category).filter(Boolean)).size,
    locations: new Set(items.map((item) => item.location).filter(Boolean)).size,
    fresh: items.filter((item) => isFreshNews(item)).length,
  }

  return (
    <PublicPage immersive className="pub--wide" title="Haberler">
      <div className="nw">
        <header className="nw-masthead">
          <p className="nw-kicker">Güncel</p>
          <h1>Arnavutköy Gündemi</h1>
          <p className="nw-dek">Bugün ilçede neler oluyor? Gelişmeler, yatırımlar ve mahalle hikâyeleri.</p>
        </header>

        <div className="nw-pulse" aria-label="Gündem özeti">
          <div>
            <strong>{loading ? '—' : stats.total}</strong>
            <span>Haber</span>
          </div>
          <div>
            <strong>{loading ? '—' : stats.fresh}</strong>
            <span>Son 30 gün</span>
          </div>
          <div>
            <strong>{loading ? '—' : stats.categories}</strong>
            <span>Kategori</span>
          </div>
          <div>
            <strong>{loading ? '—' : stats.locations}</strong>
            <span>Mahalle / yer</span>
          </div>
        </div>

        <div className="nw-toolbar">
          <p className="nw-count" aria-live="polite">
            {loading ? 'Gündem yükleniyor…' : (
              <>
                <strong>{filtered.length}</strong> haber
                {category !== 'Tümü' ? ` · ${category}` : null}
                {month ? ` · ${months.find((entry) => entry.key === month)?.label ?? ''}` : null}
              </>
            )}
          </p>
          <div className="field nw-search">
            <label htmlFor="nw-q">Haber ara</label>
            <div className="nw-search-box">
              <SearchIcon />
              <input
                id="nw-q"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Arnavutköy’de ne arıyorsunuz?"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="nw-chips" role="toolbar" aria-label="Haber kategorileri">
          {categories.map((label) => (
            <button
              key={label}
              type="button"
              className={`nw-chip${category === label ? ' is-on' : ''}`}
              aria-pressed={category === label}
              onClick={() => setCategory(label)}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {loading ? (
          <div className="nw-skel" aria-hidden>
            <div className="nw-skel-lead" />
            <div className="nw-skel-grid">
              <div />
              <div />
              <div />
            </div>
          </div>
        ) : null}

        {!loading && lead ? (
          <Link to={newsHref(lead)} className="nw-lead">
            <div className="nw-lead-media">
              <img src={coverForNews(lead).src} alt={coverForNews(lead).alt} />
            </div>
            <div className="nw-lead-copy">
              <div className="nw-lead-meta">
                <span className="nw-cat">{lead.category ?? 'Gündem'}</span>
                <NewsBadge item={lead} />
              </div>
              <h2>{lead.title}</h2>
              <p>{lead.summary}</p>
              <p className="nw-byline">
                {formatNewsDate(publishedAt(lead))}
                <span aria-hidden> · </span>
                {readingMinutes(lead.body)} dk okuma
                {lead.location ? (
                  <>
                    <span aria-hidden> · </span>
                    {lead.location}
                  </>
                ) : null}
              </p>
              <span className="nw-go">Haberi oku</span>
            </div>
          </Link>
        ) : null}

        {!loading && browsing && mosaicMain ? (
          <section className="nw-mosaic" aria-label="Öne çıkan gelişmeler">
            <Link to={newsHref(mosaicMain)} className="nw-feature">
              <div className="nw-feature-media">
                <img src={coverForNews(mosaicMain).src} alt={coverForNews(mosaicMain).alt} loading="lazy" />
              </div>
              <div className="nw-feature-copy">
                <span className="nw-cat">{mosaicMain.category ?? 'Gündem'}</span>
                <h2>{mosaicMain.title}</h2>
                <p>{mosaicMain.summary}</p>
                <span className="nw-byline">
                  {formatNewsStamp(publishedAt(mosaicMain))} · {readingMinutes(mosaicMain.body)} dk
                </span>
              </div>
            </Link>
            <div className="nw-stack">
              {mosaicSide.map((item) => (
                <NewsStackCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && latest.length > 0 ? (
          <section className="nw-latest" aria-labelledby="nw-latest-title">
            <header className="nw-section-head">
              <p>Akış</p>
              <h2 id="nw-latest-title">{browsing ? 'Son haberler' : 'Eşleşen haberler'}</h2>
            </header>
            <div className="nw-latest-grid">
              {latest.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && !q.trim() && months.length > 1 ? (
          <nav className="nw-months" aria-label="Aylara göre arşiv">
            {months.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={`nw-month${month === entry.key ? ' is-on' : ''}`}
                aria-pressed={month === entry.key}
                onClick={() => setMonth((current) => (current === entry.key ? null : entry.key))}
              >
                <strong>{entry.label}</strong>
                <span>{entry.count} haber</span>
              </button>
            ))}
          </nav>
        ) : null}

        {!loading && archive.length > 0 && browsing ? (
          <section className="nw-archive" aria-labelledby="nw-archive-title">
            <header className="nw-section-head">
              <p>Geçmişten bugüne</p>
              <h2 id="nw-archive-title">Haber arşivi</h2>
            </header>
            <ol className="nw-timeline">
              {archiveVisible.map((item) => (
                <li key={item.id}>
                  <Link to={newsHref(item)}>
                    <time dateTime={publishedAt(item).toISOString()}>{formatNewsStamp(publishedAt(item))}</time>
                    <span className="nw-cat">{item.category ?? 'Gündem'}</span>
                    <strong>{item.title}</strong>
                    <em>{item.location ?? 'Arnavutköy'}</em>
                  </Link>
                </li>
              ))}
            </ol>
            {archive.length > 6 ? (
              <button type="button" className="nw-more" onClick={() => setArchiveOpen((open) => !open)}>
                {archiveOpen ? 'Arşivi daralt' : `Daha fazla haber (${archive.length - 6})`}
              </button>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="nw-empty">
            <strong>Aradığınız kriterlere uygun haber bulunamadı.</strong>
            <p>Kategoriyi değiştirin veya aramayı sadeleştirin.</p>
          </div>
        ) : null}

        <section className="nw-continue" aria-labelledby="nw-continue-title">
          <header className="nw-section-head">
            <p>Gündemin yanında</p>
            <h2 id="nw-continue-title">Keşfetmeye devam et</h2>
          </header>
          <div className="nw-continue-grid">
            {CONTINUE.map((item) => (
              <Link key={item.to} to={item.to} className="nw-door">
                <span>{item.kicker}</span>
                <strong>{item.title}</strong>
                <p>{item.hint}</p>
              </Link>
            ))}
          </div>
        </section>

        <p className="nw-notice">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}

function NewsCard({ item }: { item: PortalContent }) {
  const cover = coverForNews(item)
  return (
    <Link to={newsHref(item)} className="nw-card">
      <div className="nw-card-media">
        <img src={cover.src} alt={cover.alt} loading="lazy" />
      </div>
      <div className="nw-card-copy">
        <div className="nw-card-top">
          <span className="nw-cat">{item.category ?? 'Gündem'}</span>
          <NewsBadge item={item} />
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <span className="nw-byline">
          {formatNewsStamp(publishedAt(item))} · {readingMinutes(item.body)} dk
        </span>
      </div>
    </Link>
  )
}

function NewsStackCard({ item }: { item: PortalContent }) {
  const cover = coverForNews(item)
  return (
    <Link to={newsHref(item)} className="nw-mini">
      <img src={cover.src} alt={cover.alt} loading="lazy" />
      <div>
        <span className="nw-cat">{item.category ?? 'Gündem'}</span>
        <strong>{item.title}</strong>
        <span className="nw-byline">{formatNewsStamp(publishedAt(item))}</span>
      </div>
    </Link>
  )
}

export function NewsDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<PortalContent | null>(null)
  const [pool, setPool] = useState<PortalContent[]>([])
  const [projects, setProjects] = useState<PortalContent[]>([])
  const [events, setEvents] = useState<PortalContent[]>([])
  const [venues, setVenues] = useState<PortalContent[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shareNote, setShareNote] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setItem(null)
    setError(null)
    void (async () => {
      try {
        const path = isNewsId(id) ? `/api/v1/portal/${id}` : `/api/v1/portal/by-slug/${id}`
        const [story, newsPage, projectPage, eventPage, announcementPage, venuePage] = await Promise.all([
          apiFetch<PortalContent>(path),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=News&pageSize=80'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Project&pageSize=50'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Event&pageSize=50'),
          apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=50'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=CultureVenue&pageSize=50'),
        ])
        if (cancelled) return
        setItem(story)
        setPool(newsPage.items)
        setProjects(projectPage.items)
        setEvents(eventPage.items)
        setAnnouncements(announcementPage.items)
        setVenues(venuePage.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Haber yüklenemedi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const parsed = item ? parseNewsBody(item.body) : null
  const cover = item ? coverForNews(item) : null
  const similar = item ? relatedNews(item, pool) : []
  const activity = parsed?.extras.activitySlug
    ? projects.find((entry) => entry.slug === parsed.extras.activitySlug) ?? null
    : null
  const event = parsed?.extras.eventSlug
    ? events.find((entry) => entry.slug === parsed.extras.eventSlug) ?? null
    : null
  const announcement = parsed ? matchAnnouncement(parsed.extras.announcementTitle, announcements) : null
  const cultureVenue = item ? cultureVenueForNews(item, venues) : null
  const minutes = item ? readingMinutes(item.body) : 0
  const gallery = item ? newsGallery(item) : []

  async function onShare() {
    if (!item) return
    try {
      await shareNews(item.title, newsHref(item))
      setShareNote('Bağlantı kopyalandı.')
    } catch {
      setShareNote(null)
    }
  }

  return (
    <PublicPage immersive className="pub--wide" title={item?.title ?? 'Haber'}>
      <div className="nw nwd">
        <Link className="nw-back" to="/haberler">
          ← Gündeme dön
        </Link>

        {error ? <div className="error-box">{error}</div> : null}
        {!item && !error ? <p className="nw-loading">Haber açılıyor…</p> : null}

        {item && parsed && cover ? (
          <>
            <header className="nwd-head">
              <div className="nw-lead-meta">
                <span className="nw-cat">{item.category ?? 'Gündem'}</span>
                <NewsBadge item={item} />
              </div>
              <h1>{item.title}</h1>
              <p className="nwd-dek">{item.summary}</p>
              <p className="nw-byline">
                {formatNewsDate(publishedAt(item))}
                <span aria-hidden> · </span>
                {minutes} dk okuma
                {item.location ? (
                  <>
                    <span aria-hidden> · </span>
                    {item.location}
                  </>
                ) : null}
                {parsed.extras.source ? (
                  <>
                    <span aria-hidden> · </span>
                    Kaynak: {parsed.extras.source}
                  </>
                ) : null}
              </p>
            </header>

            <figure className="nwd-cover">
              <img src={cover.src} alt={cover.alt} />
            </figure>

            <div className="nwd-layout">
              <article className="nwd-prose">
                {parsed.headings.length >= 2 ? (
                  <nav className="nwd-toc" aria-label="Bu haberde">
                    <p>Bu haberde</p>
                    <ol>
                      {parsed.headings.map((heading) => (
                        <li key={heading}>{heading}</li>
                      ))}
                    </ol>
                  </nav>
                ) : null}

                {parsed.blocks.map((block, index) => {
                  if (block.type === 'h') return <h2 key={`${block.text}-${index}`}>{block.text}</h2>
                  if (block.type === 'q') return <blockquote key={`${block.text}-${index}`}>{block.text}</blockquote>
                  if (block.type === 'ul') {
                    return (
                      <ul key={`ul-${index}`}>
                        {block.items.map((entry) => (
                          <li key={entry}>{entry}</li>
                        ))}
                      </ul>
                    )
                  }
                  return <p key={`${block.text.slice(0, 32)}-${index}`}>{block.text}</p>
                })}

                {parsed.extras.tags.length > 0 ? (
                  <ul className="nwd-tags">
                    {parsed.extras.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <aside className="nwd-rail">
                <p className="nwd-rail-kicker">Haber dosyası</p>
                <dl>
                  <div>
                    <dt>Yayımlanma</dt>
                    <dd>{formatNewsDate(publishedAt(item))}</dd>
                  </div>
                  <div>
                    <dt>Okuma</dt>
                    <dd>{minutes} dakika</dd>
                  </div>
                  {item.location ? (
                    <div>
                      <dt>Yer</dt>
                      <dd>{item.location}</dd>
                    </div>
                  ) : null}
                  {parsed.extras.source ? (
                    <div>
                      <dt>Kaynak</dt>
                      <dd>{parsed.extras.source}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="nwd-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => void onShare()}>
                    Paylaş
                  </button>
                  <Link className="btn btn-ghost" to="/haberler">
                    Geri dön
                  </Link>
                </div>
                {shareNote ? <p className="nwd-share-note">{shareNote}</p> : null}

                {activity || event || announcement || cultureVenue ? (
                  <div className="nwd-links">
                    <p>İlgili içerik</p>
                    {activity ? (
                      <Link to={`/faaliyetler/${activity.id}`}>Faaliyet · {activity.title}</Link>
                    ) : null}
                    {event ? <Link to={`/etkinlikler/${event.id}`}>Etkinlik · {event.title}</Link> : null}
                    {announcement ? (
                      <Link to={`/duyurular/${announcement.id}`}>Duyuru · {announcement.title}</Link>
                    ) : null}
                    {cultureVenue ? (
                      <Link to={cultureHref(cultureVenue)}>Kültür mekânı · {cultureVenue.title}</Link>
                    ) : null}
                  </div>
                ) : null}
              </aside>
            </div>

            <section className="nwd-gallery" aria-labelledby="nwd-gallery-title">
              <h2 id="nwd-gallery-title">Görseller</h2>
              <div>
                {gallery.map((image) => (
                  <figure key={image.src}>
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </figure>
                ))}
              </div>
            </section>

            {similar.length > 0 ? (
              <section className="nw-latest" aria-labelledby="nwd-similar-title">
                <header className="nw-section-head">
                  <p>Aynı gündem</p>
                  <h2 id="nwd-similar-title">Benzer haberler</h2>
                </header>
                <div className="nw-latest-grid">
                  {similar.map((entry) => (
                    <NewsCard key={entry.id} item={entry} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="nw-continue" aria-labelledby="nwd-continue-title">
              <header className="nw-section-head">
                <p>Gündemin yanında</p>
                <h2 id="nwd-continue-title">Keşfetmeye devam et</h2>
              </header>
              <div className="nw-continue-grid">
                {CONTINUE.map((entry) => (
                  <Link key={entry.to} to={entry.to} className="nw-door">
                    <span>{entry.kicker}</span>
                    <strong>{entry.title}</strong>
                    <p>{entry.hint}</p>
                  </Link>
                ))}
              </div>
            </section>

            <p className="nw-notice">{NOTICE}</p>
          </>
        ) : null}
      </div>
    </PublicPage>
  )
}
