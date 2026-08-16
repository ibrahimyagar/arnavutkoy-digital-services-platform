import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage, PublicRelated } from '../components/ui/PublicPage'
import { apiFetch, type Paginated, type PortalContent } from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'
import {
  PROJECT_CATEGORIES,
  coverForProject,
  formatProjectDate,
  normalizeProjectHref,
  osmEmbedSrc,
  osmOpenSrc,
  parseProjectBody,
  pickFeaturedProject,
  projectGallery,
  projectProgress,
  projectStatus,
  projectVenue,
  relatedProjectService,
  shareProject,
} from '../lib/projectVisuals'
import './projects.css'

function SearchIcon() {
  return (
    <svg className="pj-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function ProjectsPage() {
  const [items, setItems] = useState<PortalContent[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Project&pageSize=50')
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Faaliyetler yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return items
      .filter((item) => (category === 'Tümü' ? true : item.category === category))
      .filter((item) => {
        if (!needle) return true
        return (
          item.title.toLocaleLowerCase('tr-TR').includes(needle) ||
          item.summary.toLocaleLowerCase('tr-TR').includes(needle) ||
          (item.category ?? '').toLocaleLowerCase('tr-TR').includes(needle) ||
          (item.location ?? '').toLocaleLowerCase('tr-TR').includes(needle)
        )
      })
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [items, category, q])

  const featured = pickFeaturedProject(filtered)
  const rest = featured ? filtered.filter((item) => item.id !== featured.id) : []
  const ongoing = items.filter((item) => projectStatus(parseProjectBody(item.body).extras).id === 'ongoing').length
  const planning = items.filter((item) => projectStatus(parseProjectBody(item.body).extras).id === 'planning').length
  const done = items.filter((item) => projectStatus(parseProjectBody(item.body).extras).id === 'done').length

  return (
    <PublicPage immersive className="pub--wide" title="Faaliyetler">
      <div className="pj">
        <header className="pj-hero">
          <img src={COVERS.projects.src} alt={COVERS.projects.alt} />
          <span className="pj-hero-shade" aria-hidden />
          <div className="pj-hero-copy">
            <p className="pj-kicker">Yatırım defteri</p>
            <h1>Faaliyetler</h1>
            <p>Park, yol, altyapı, sosyal tesis, çevre, spor ve kültür yatırımlarının mahalle bazlı özeti. İlerleme ve bütçe rakamları kurgusal demo veridir.</p>
          </div>
        </header>

        <div className="pj-stats" aria-label="Yatırım özeti">
          <div>
            <strong>{loading ? '—' : items.length}</strong>
            <span>Kayıtlı faaliyet</span>
          </div>
          <div>
            <strong>{loading ? '—' : ongoing}</strong>
            <span>Devam eden iş</span>
          </div>
          <div>
            <strong>{loading ? '—' : planning}</strong>
            <span>Planlama</span>
          </div>
          <div>
            <strong>{loading ? '—' : done}</strong>
            <span>Tamamlanan</span>
          </div>
        </div>

        <div className="pj-toolbar">
          <p className="pj-count" aria-live="polite">
            {loading ? 'Faaliyetler yükleniyor…' : (
              <>
                <strong>{filtered.length}</strong> faaliyet gösteriliyor
              </>
            )}
          </p>
          <div className="pj-chips" role="toolbar" aria-label="Faaliyet kategorileri">
            {['Tümü', ...PROJECT_CATEGORIES].map((label) => (
              <button
                key={label}
                type="button"
                className={`pj-chip${category === label ? ' is-on' : ''}`}
                aria-pressed={category === label}
                onClick={() => setCategory(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="field pj-search">
            <label htmlFor="pj-q">Faaliyet ara</label>
            <div className="pj-search-box">
              <SearchIcon />
              <input
                id="pj-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Park, mahalle, yol…"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        {error ? <div className="error-box" role="alert">{error}</div> : null}

        {loading ? (
          <div className="pj-skel" aria-busy="true" />
        ) : featured ? (
          <>
            <ProjectShowcase item={featured} />
            {rest.length > 0 ? (
              <div className="pj-grid">
                {rest.map((item) => (
                  <ProjectCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="pj-empty">Bu süzgeçte faaliyet yok.</p>
        )}

        <PublicRelated items={RELATED.investments} />
      </div>
    </PublicPage>
  )
}

function ProjectShowcase({ item }: { item: PortalContent }) {
  const cover = coverForProject(item)
  const parsed = parseProjectBody(item.body)
  const status = projectStatus(parsed.extras)
  const progress = projectProgress(parsed.extras)

  return (
    <Link to={`/faaliyetler/${item.id}`} className="pj-featured">
      <div className="pj-featured-media">
        <img src={cover.src} alt={cover.alt} />
        <span className="pj-featured-shade" aria-hidden />
      </div>
      <div className="pj-featured-copy">
        <p className="pj-pill">Öne çıkan yatırım</p>
        <div className="pj-tags">
          {item.category ? <span className="pj-tag">{item.category}</span> : null}
          <span className={`pj-tag pj-tag--${status.id}`}>{status.label}</span>
        </div>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
        <div className="pj-featured-meta">
          {item.location ? <span>{item.location}</span> : null}
          <span>{formatProjectDate(item.startsAtUtc)}</span>
        </div>
        {progress != null ? (
          <div className="pj-meter" aria-hidden>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <span className="pj-go">Detayları gör →</span>
      </div>
    </Link>
  )
}

function ProjectCard({ item }: { item: PortalContent }) {
  const cover = coverForProject(item)
  const parsed = parseProjectBody(item.body)
  const status = projectStatus(parsed.extras)
  const progress = projectProgress(parsed.extras)

  return (
    <Link to={`/faaliyetler/${item.id}`} className="pj-card">
      <div className="pj-card-media">
        <img src={cover.src} alt="" />
        <span className={`pj-card-status pj-tag pj-tag--${status.id}`}>{status.label}</span>
      </div>
      <div className="pj-card-body">
        {item.category ? <span className="pj-pill">{item.category}</span> : null}
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <div className="pj-card-meta">
          {item.location ? <span>{item.location}</span> : null}
          <span>{formatProjectDate(item.startsAtUtc)}</span>
        </div>
        {progress != null ? (
          <div className="pj-meter" aria-hidden>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
        <span className="pj-go">Detayları gör →</span>
      </div>
    </Link>
  )
}

function ProjectCta({ href, children }: { href: string; children: string }) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a className="btn btn-primary" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link className="btn btn-primary" to={href}>
      {children}
    </Link>
  )
}

export function ProjectsDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<PortalContent | null>(null)
  const [related, setRelated] = useState<PortalContent[]>([])
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
          apiFetch<PortalContent>(`/api/v1/portal/${id}`),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Project&pageSize=50'),
        ])
        if (cancelled) return
        setItem(detail)
        setRelated(
          page.items
            .filter((entry) => entry.id !== detail.id)
            .sort((a, b) => {
              const same = Number(b.category === detail.category) - Number(a.category === detail.category)
              if (same !== 0) return same
              return a.sortOrder - b.sortOrder
            })
            .slice(0, 3),
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Faaliyet bulunamadı.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const cover = item ? coverForProject(item) : null
  const parsed = item ? parseProjectBody(item.body) : null
  const status = parsed ? projectStatus(parsed.extras) : null
  const progress = parsed ? projectProgress(parsed.extras) : null
  const venue = item ? projectVenue(item) : null
  const relatedService = item ? relatedProjectService(item.category) : null
  const href = parsed?.extras.link ? normalizeProjectHref(parsed.extras.link) : null

  async function onShare() {
    if (!item) return
    try {
      const result = await shareProject(item)
      setNotice(result === 'copied' ? 'Faaliyet bağlantısı kopyalandı.' : 'Paylaşım penceresi açıldı.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setNotice(`Bağlantı: ${window.location.href}`)
    }
  }

  return (
    <PublicPage immersive className="pub--wide" title={item?.title ?? 'Faaliyet'}>
      <p className="pj-nav">
        <Link to="/faaliyetler">← Tüm faaliyetler</Link>
      </p>
      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {notice ? <div className="success-box" role="status">{notice}</div> : null}
      {!item && !error ? (
        <>
          <h1 className="sr-only">Faaliyet</h1>
          <div className="pj-skel" aria-busy="true" />
        </>
      ) : null}

      {item && cover && parsed && status && venue ? (
        <div className="pjd">
          <div className="pjd-hero">
            <img src={cover.src} alt={cover.alt} />
            <span className="pjd-hero-shade" aria-hidden />
            <div className="pjd-hero-copy">
              <div className="pj-tags">
                {item.category ? <span className="pj-tag">{item.category}</span> : null}
                <span className={`pj-tag pj-tag--${status.id}`}>{status.label}</span>
              </div>
              <h1>{item.title}</h1>
              <p>{item.summary}</p>
              {progress != null ? (
                <div className="pjd-hero-meter">
                  <span>İlerleme %{progress}</span>
                  <div className="pj-meter pj-meter--light" aria-hidden>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="pjd-facts">
            <div>
              <span>Kategori</span>
              <strong>{item.category ?? 'Genel'}</strong>
            </div>
            <div>
              <span>Konum</span>
              <strong>{item.location ?? venue.label}</strong>
            </div>
            <div>
              <span>Durum</span>
              <strong>{status.label}</strong>
            </div>
            <div>
              <span>Takvim</span>
              <strong>
                {formatProjectDate(item.startsAtUtc)}
                {item.endsAtUtc ? ` — ${formatProjectDate(item.endsAtUtc)}` : ''}
              </strong>
            </div>
          </div>

          <div className="pjd-layout">
            <div className="pjd-main">
              <article className="pjd-prose">
                <h2>Proje özeti</h2>
                {(parsed.paragraphs.length > 0 ? parsed.paragraphs : [item.summary]).map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </article>
              <section className="pjd-gallery" aria-labelledby="pjd-gallery-title">
                <h2 id="pjd-gallery-title">Saha görselleri</h2>
                <div className="pjd-gallery-grid">
                  {projectGallery(item).map((image) => (
                    <figure key={image.src}>
                      <img src={image.src} alt={image.alt} />
                    </figure>
                  ))}
                </div>
              </section>
              <section className="pjd-venue" aria-labelledby="pjd-venue-title">
                <div className="pjd-venue-copy">
                  <h2 id="pjd-venue-title">Saha</h2>
                  <p>{item.location ?? venue.label}</p>
                  <a href={osmOpenSrc(venue)} target="_blank" rel="noreferrer">
                    OpenStreetMap’te aç →
                  </a>
                </div>
                <div className="pj-map">
                  <iframe
                    title={`${venue.label} haritası`}
                    src={osmEmbedSrc(venue)}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            </div>

            <aside className="pjd-file">
              <p className="pjd-file-kicker">Proje dosyası</p>
              <h2>{status.label}</h2>
              {progress != null ? (
                <div className="pjd-progress">
                  <div className="pjd-progress-row">
                    <span>Fiziki gerçekleşme</span>
                    <em>%{progress}</em>
                  </div>
                  <div className="pj-meter" aria-hidden>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
              <dl>
                {parsed.extras.budget ? (
                  <div>
                    <dt>Bütçe</dt>
                    <dd>{parsed.extras.budget}</dd>
                  </div>
                ) : null}
                {parsed.extras.contractor ? (
                  <div>
                    <dt>Yüklenici</dt>
                    <dd>{parsed.extras.contractor}</dd>
                  </div>
                ) : null}
                {item.location ? (
                  <div>
                    <dt>Mahalle / aks</dt>
                    <dd>{item.location}</dd>
                  </div>
                ) : null}
                {item.endsAtUtc ? (
                  <div>
                    <dt>Hedef teslim</dt>
                    <dd>{formatProjectDate(item.endsAtUtc)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="pjd-actions">
                {href ? <ProjectCta href={href}>İlgili hizmet</ProjectCta> : null}
                <div className="pjd-btn-row">
                  <button type="button" className="btn btn-ghost" onClick={() => void onShare()}>
                    Paylaş
                  </button>
                  <Link className="btn btn-ghost" to="/faaliyetler">
                    Geri dön
                  </Link>
                </div>
                {relatedService ? (
                  <Link className="pjd-related-service" to={relatedService.to}>
                    {relatedService.label} →
                  </Link>
                ) : null}
              </div>
            </aside>
          </div>

          {related.length > 0 ? (
            <section className="pjd-more" aria-labelledby="pjd-more-title">
              <h2 id="pjd-more-title">Diğer yatırımlar</h2>
              <div className="pjd-more-grid">
                {related.map((entry) => (
                  <ProjectCard key={entry.id} item={entry} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="notice">
            Kurgusal demo yatırım kaydıdır; resmi Arnavutköy Belediyesi projesi değildir.
          </div>
          <PublicRelated items={RELATED.investments} />
        </div>
      ) : null}
    </PublicPage>
  )
}
