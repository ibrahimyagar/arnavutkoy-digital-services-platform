import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage, PublicRelated } from '../components/ui/PublicPage'
import {
  ANNOUNCEMENT_CATEGORIES,
  announcementCtas,
  announcementPublishedAt,
  classifyAnnouncement,
  contactTelHref,
  daysUntil,
  excerpt,
  formatAnnouncementStamp,
  formatAnnouncementWhen,
  isExternalHref,
  parseAnnouncementContent,
  readingMinutes,
  relatedAnnouncementService,
  shareAnnouncement,
  type AnnouncementCategory,
  type AnnouncementCategoryId,
} from '../lib/announcementVisuals'
import { apiFetch, type Announcement, type Paginated } from '../lib/api'
import { RELATED } from '../lib/contentVisuals'
import './announcements.css'

type Bulletin = {
  item: Announcement
  category: AnnouncementCategory
  published: Date
}

function toBulletin(item: Announcement): Bulletin {
  return {
    item,
    category: classifyAnnouncement(item.title, item.content),
    published: announcementPublishedAt(item),
  }
}

function validityLabel(item: Announcement): { text: string; urgent: boolean } | null {
  const days = daysUntil(item.publishEndUtc)
  if (days === null) return null
  if (days < 0) return { text: 'Süresi doldu', urgent: true }
  if (days === 0) return { text: 'Bugün sona erer', urgent: true }
  if (days <= 14) return { text: `${days} gün kaldı`, urgent: true }
  return {
    text: `${new Date(item.publishEndUtc!).toLocaleDateString('tr-TR')} tarihine kadar`,
    urgent: false,
  }
}

function SearchIcon() {
  return (
    <svg className="ann-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState<'all' | AnnouncementCategoryId>('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=50')
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Duyurular yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const bulletins = useMemo(() => items.map(toBulletin), [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return bulletins.filter((entry) => {
      if (categoryId !== 'all' && entry.category.id !== categoryId) return false
      if (!needle) return true
      const parsed = parseAnnouncementContent(entry.item.content)
      return (
        entry.item.title.toLocaleLowerCase('tr-TR').includes(needle) ||
        parsed.lead.toLocaleLowerCase('tr-TR').includes(needle) ||
        entry.item.content.toLocaleLowerCase('tr-TR').includes(needle)
      )
    })
  }, [bulletins, categoryId, q])

  const featured = filtered[0] ?? null
  const rest = featured ? filtered.slice(1) : []
  const timedCount = bulletins.filter((entry) => entry.item.publishEndUtc).length

  return (
    <PublicPage
      eyebrow="Resmi bülten"
      title="Duyurular"
      lead="Yayımlanmış belediye bildirimleri. Kategori seçin veya arayın; ayrıntı için duyuru kartına gidin."
    >
      <div className="ann">
        <div className="ann-toolbar">
          <div className="ann-toolbar-top">
            <p className="ann-count" aria-live="polite">
              {loading ? (
                'Duyurular yükleniyor…'
              ) : (
                <>
                  <strong>{filtered.length}</strong> duyuru gösteriliyor
                  {q || categoryId !== 'all' ? ` · toplam ${items.length}` : null}
                  {timedCount > 0 && categoryId === 'all' && !q ? ` · ${timedCount} süreli` : null}
                </>
              )}
            </p>
            <div className="field ann-search">
              <label htmlFor="ann-q">Duyuru ara</label>
              <div className="ann-search-box">
                <SearchIcon />
                <input
                  id="ann-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Hadımköy, bakım, sosyal…"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="ann-chips" role="toolbar" aria-label="Duyuru kategorileri">
            <button
              type="button"
              className={`ann-chip${categoryId === 'all' ? ' is-on' : ''}`}
              aria-pressed={categoryId === 'all'}
              onClick={() => setCategoryId('all')}
            >
              Tümü
            </button>
            {ANNOUNCEMENT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`ann-chip${categoryId === category.id ? ' is-on' : ''}`}
                aria-pressed={categoryId === category.id}
                onClick={() => setCategoryId(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        {loading ? (
          <div className="ann-board" aria-hidden>
            <div className="ann-skel ann-skel--hero" />
            <div className="ann-grid">
              <div className="ann-skel ann-skel--hero" />
              <div className="ann-skel ann-skel--hero" />
            </div>
          </div>
        ) : null}

        {!loading && featured ? (
          <>
            <FeaturedBulletin entry={featured} />
            {rest.length > 0 ? (
              <section className="ann-board" aria-label="Duyuru arşivi">
                <div className="ann-board-head">
                  <h2>Tüm duyurular</h2>
                </div>
                <div className="ann-grid">
                  {rest.map((entry) => (
                    <AnnouncementCard key={entry.item.id} entry={entry} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="ann-empty">
            <strong>{q || categoryId !== 'all' ? 'Eşleşen duyuru yok' : 'Yayında duyuru yok'}</strong>
            <p>
              {q || categoryId !== 'all'
                ? 'Aramayı veya kategoriyi değiştirerek tekrar deneyin.'
                : 'Yeni bildirimler yayımlandığında burada görünür.'}
            </p>
          </div>
        ) : null}
      </div>

      <PublicRelated items={RELATED.media} />
    </PublicPage>
  )
}

function FeaturedBulletin({ entry }: { entry: Bulletin }) {
  const validity = validityLabel(entry.item)
  const parsed = parseAnnouncementContent(entry.item.content)
  const minutes = readingMinutes(entry.item.content)

  return (
    <Link to={`/duyurular/${entry.item.id}`} className="ann-featured">
      <div className="ann-featured-media">
        <img src={entry.category.cover.src} alt="" />
        <span className="ann-featured-shade" aria-hidden />
      </div>
      <div className="ann-featured-copy">
        <div className="ann-kicker">
          <span className="ann-tag">Öne çıkan</span>
          <span className="ann-tag ann-tag--ghost">{entry.category.label}</span>
        </div>
        <h2>{entry.item.title}</h2>
        <p>{excerpt(parsed.lead || entry.item.content, 210)}</p>
        <div className="ann-featured-meta">
          <span>{formatAnnouncementWhen(entry.published)}</span>
          {validity ? <span>{validity.text}</span> : null}
          <span>{minutes} dk okuma</span>
        </div>
        <span className="ann-featured-go">Ayrıntılı duyuru →</span>
      </div>
    </Link>
  )
}

function AnnouncementCard({ entry }: { entry: Bulletin }) {
  const stamp = formatAnnouncementStamp(entry.published)
  const validity = validityLabel(entry.item)
  const parsed = parseAnnouncementContent(entry.item.content)

  return (
    <Link to={`/duyurular/${entry.item.id}`} className="ann-card">
      <div className="ann-card-media">
        <img src={entry.category.cover.src} alt="" />
        <time className="ann-card-date" dateTime={entry.published.toISOString()}>
          <b>{stamp.day}</b>
          <span>{stamp.month}</span>
        </time>
      </div>
      <div className="ann-card-body">
        <div className="ann-row-meta">
          <span className="ann-pill">{entry.category.label}</span>
          {validity ? (
            <span className={`ann-pill${validity.urgent ? ' ann-pill--warn' : ''}`}>{validity.text}</span>
          ) : null}
        </div>
        <h3>{entry.item.title}</h3>
        <p>{excerpt(parsed.lead || entry.item.content, 140)}</p>
        <span className="ann-card-go">Devamını oku →</span>
      </div>
    </Link>
  )
}

function BulletinRow({ entry }: { entry: Bulletin }) {
  const stamp = formatAnnouncementStamp(entry.published)

  return (
    <Link to={`/duyurular/${entry.item.id}`} className="ann-row">
      <time className="ann-stamp" dateTime={entry.published.toISOString()}>
        <b>{stamp.day}</b>
        <span>{stamp.month}</span>
      </time>
      <div className="ann-row-copy">
        <div className="ann-row-meta">
          <span className="ann-pill">{entry.category.label}</span>
        </div>
        <h3>{entry.item.title}</h3>
      </div>
    </Link>
  )
}

export function AnnouncementDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Announcement | null>(null)
  const [related, setRelated] = useState<Bulletin[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setItem(null)
    setError(null)
    setNotice(null)
    void (async () => {
      try {
        const [detail, page] = await Promise.all([
          apiFetch<Announcement>(`/api/v1/announcements/${id}`),
          apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=50'),
        ])
        if (cancelled) return
        setItem(detail)
        const current = classifyAnnouncement(detail.title, detail.content)
        setRelated(
          page.items
            .filter((entry) => entry.id !== detail.id)
            .map(toBulletin)
            .sort((a, b) => {
              const sameCategory = Number(b.category.id === current.id) - Number(a.category.id === current.id)
              if (sameCategory !== 0) return sameCategory
              return b.published.getTime() - a.published.getTime()
            })
            .slice(0, 3),
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Duyuru bulunamadı.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const category = item ? classifyAnnouncement(item.title, item.content) : null
  const published = item ? announcementPublishedAt(item) : null
  const created = item ? new Date(item.createdAtUtc) : null
  const validity = item ? validityLabel(item) : null
  const parsed = item ? parseAnnouncementContent(item.content) : null
  const minutes = item ? readingMinutes(item.content) : 1
  const ctas = parsed ? announcementCtas(parsed.extras) : []
  const relatedService = category ? relatedAnnouncementService(category.id) : null
  const showCreated =
    item && published && created
      ? Math.abs(created.getTime() - published.getTime()) > 86_400_000
      : false

  async function onShare() {
    if (!item) return
    setError(null)
    try {
      const result = await shareAnnouncement(item)
      setNotice(result === 'copied' ? 'Duyuru bağlantısı kopyalandı.' : 'Paylaşım penceresi açıldı.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setNotice(`Bağlantı: ${window.location.href}`)
    }
  }

  return (
    <PublicPage immersive className="pub--wide" title={item?.title ?? 'Duyuru'}>
      <p className="and-nav">
        <Link to="/duyurular">← Tüm duyurular</Link>
      </p>

      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {notice ? <div className="success-box" role="status">{notice}</div> : null}
      {!item && !error ? (
        <>
          <h1 className="sr-only">Duyuru</h1>
          <div className="ann-board" aria-busy="true">
            <div className="ann-skel ann-skel--hero" />
            <div className="ann-skel ann-skel--row" />
          </div>
        </>
      ) : null}

      {item && published && category && parsed ? (
        <div className="and">
          <header className="and-masthead">
            <div className="and-masthead-copy">
              <p className="and-kicker">Resmi bülten</p>
              <div className="ann-kicker">
                <span className="ann-tag">{category.label}</span>
                {validity ? (
                  <span className={`ann-tag${validity.urgent ? '' : ' ann-tag--ghost'}`}>{validity.text}</span>
                ) : (
                  <span className="ann-tag ann-tag--ghost">Yayımlanmış</span>
                )}
              </div>
              <h1>{item.title}</h1>
              <p>{parsed.lead || excerpt(item.content, 220)}</p>
              <ul className="and-meta">
                <li>{formatAnnouncementWhen(published)}</li>
                <li>{minutes} dk okuma</li>
                {parsed.extras.unit ? <li>{parsed.extras.unit}</li> : null}
              </ul>
            </div>
            <div className="and-masthead-media">
              <img src={category.cover.src} alt={category.cover.alt} />
              <span className="and-masthead-shade" aria-hidden />
            </div>
          </header>

          <div className="and-facts">
            <div>
              <span>Kategori</span>
              <strong>{category.label}</strong>
            </div>
            <div>
              <span>Yayımlanma</span>
              <strong>{formatAnnouncementWhen(published)}</strong>
            </div>
            <div>
              <span>{showCreated ? 'Kayıt tarihi' : 'Geçerlilik'}</span>
              <strong>
                {showCreated && created
                  ? formatAnnouncementWhen(created)
                  : validity?.text ?? 'Süresiz'}
              </strong>
            </div>
            <div>
              <span>Okuma</span>
              <strong>{minutes} dakika</strong>
            </div>
          </div>

          <div className="and-layout">
            <article className="and-prose">
              <h2>Duyuru metni</h2>
              {parsed.lead ? <p className="and-prose-lead">{parsed.lead}</p> : null}
              {parsed.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </article>

            <aside className="and-dossier">
              <p className="and-dossier-kicker">Özet</p>
              <h2>Duyuru bilgisi</h2>
              <dl>
                <div>
                  <dt>Yayımlanma</dt>
                  <dd>{formatAnnouncementWhen(published)}</dd>
                </div>
                {item.publishEndUtc ? (
                  <div>
                    <dt>Son geçerlilik</dt>
                    <dd>{formatAnnouncementWhen(new Date(item.publishEndUtc))}</dd>
                  </div>
                ) : (
                  <div>
                    <dt>Süre</dt>
                    <dd>Bitiş tarihi yok</dd>
                  </div>
                )}
                {parsed.extras.unit ? (
                  <div>
                    <dt>Sorumlu birim</dt>
                    <dd>{parsed.extras.unit}</dd>
                  </div>
                ) : null}
                {parsed.extras.area ? (
                  <div>
                    <dt>Etkilenen yerler</dt>
                    <dd>{parsed.extras.area}</dd>
                  </div>
                ) : null}
                {parsed.extras.hours ? (
                  <div>
                    <dt>Çalışma saati</dt>
                    <dd>{parsed.extras.hours}</dd>
                  </div>
                ) : null}
                {parsed.extras.contact ? (
                  <div>
                    <dt>İletişim</dt>
                    <dd>
                      {contactTelHref(parsed.extras.contact) ? (
                        <a href={contactTelHref(parsed.extras.contact)!}>{parsed.extras.contact}</a>
                      ) : (
                        parsed.extras.contact
                      )}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="and-actions">
                {ctas.map((cta) =>
                  isExternalHref(cta.href) ? (
                    <a key={cta.href} className="btn btn-primary" href={cta.href} target="_blank" rel="noreferrer">
                      {cta.label}
                    </a>
                  ) : (
                    <Link key={cta.href} className="btn btn-primary" to={cta.href}>
                      {cta.label}
                    </Link>
                  ),
                )}
                <div className="and-btn-row">
                  <button type="button" className="btn btn-ghost" onClick={() => void onShare()}>
                    Paylaş
                  </button>
                  <Link className="btn btn-ghost" to="/duyurular">
                    Geri dön
                  </Link>
                </div>
                {relatedService ? (
                  <Link className="and-related-service" to={relatedService.to}>
                    {relatedService.label} →
                  </Link>
                ) : null}
              </div>
            </aside>
          </div>

          {related.length > 0 ? (
            <section className="and-more" aria-labelledby="and-more-title">
              <h2 id="and-more-title">İlgili duyurular</h2>
              <div className="and-more-grid">
                {related.map((entry) => (
                  <AnnouncementCard key={entry.item.id} entry={entry} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="notice">
            Bağımsız demo duyurusudur; gerçek Arnavutköy Belediyesi bildirimi değildir.
          </div>
          <PublicRelated items={RELATED.media} />
        </div>
      ) : null}
    </PublicPage>
  )
}
