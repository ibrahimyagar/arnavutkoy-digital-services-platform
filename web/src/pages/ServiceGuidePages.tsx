import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PublicPage } from '../components/ui/PublicPage'
import { apiFetch, type Paginated, type PortalContent } from '../lib/api'
import { loginPath } from '../lib/returnUrl'
import {
  coverForGuide,
  defaultGuideSteps,
  featuredGuides,
  guideHref,
  isGuideId,
  parseGuideBody,
  presentGuideCategories,
  presentGuideKinds,
  readRecentGuides,
  relatedGuides,
  rememberGuide,
  scenarioGuides,
  searchGuide,
  type GuideKind,
} from '../lib/serviceGuideVisuals'
import './service-guide.css'

const NOTICE =
  'Bu platform portföy/demo amaçlıdır. Resmi belediye hizmet rehberi değildir; yönlendirmeler bu projedeki çalışan işlemlere gider.'

const CONTINUE = [
  {
    to: '/e-belediye',
    kicker: 'İşlem merkezi',
    title: 'E-Belediye',
    hint: 'Dijital işlemlerinizi tek masadan yönetin.',
  },
  {
    to: '/muhtarliklar',
    kicker: 'Mahalle',
    title: 'Muhtarlıklar',
    hint: 'Mahallenizdeki iletişim noktasını bulun.',
  },
  {
    to: '/haberler',
    kicker: 'Gündem',
    title: 'Haberler',
    hint: 'İlçeden güncel gelişmeleri takip edin.',
  },
  {
    to: '/etkinlikler',
    kicker: 'Takvim',
    title: 'Etkinlikler',
    hint: 'Yaklaşan etkinlikleri keşfedin.',
  },
] as const

function SearchIcon() {
  return (
    <svg className="hg-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function KindMark({ kind }: { kind?: GuideKind }) {
  return <span className="hg-kind">{kind ?? 'Hizmet'}</span>
}

function actionHref(route: string | undefined, requiresAuth: boolean, signedIn: boolean): string | null {
  if (!route || !route.startsWith('/') || route.startsWith('//')) return null
  return requiresAuth && !signedIn ? loginPath(route) : route
}

export function ServiceGuidePage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<PortalContent[]>([])
  const [q, setQ] = useState('')
  const [needle, setNeedle] = useState('')
  const [pending, setPending] = useState(false)
  const [category, setCategory] = useState('Tümü')
  const [kind, setKind] = useState<GuideKind | 'Tümü'>('Tümü')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=ServiceGuide&pageSize=50')
        if (!cancelled) setItems(page.items)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Hizmet rehberi yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const value = q.trim()
    if (!value) {
      setNeedle('')
      setPending(false)
      return
    }
    setPending(true)
    const timer = window.setTimeout(() => {
      setNeedle(value.toLocaleLowerCase('tr-TR'))
      setPending(false)
    }, 140)
    return () => window.clearTimeout(timer)
  }, [q])

  const categories = useMemo(() => presentGuideCategories(items), [items])
  const kinds = useMemo(() => presentGuideKinds(items), [items])
  const parsedMap = useMemo(() => new Map(items.map((item) => [item.id, parseGuideBody(item.body)])), [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const extras = parsedMap.get(item.id)?.extras
      if (!needle && category !== 'Tümü' && item.category !== category) return false
      if (kind !== 'Tümü' && extras?.kind !== kind) return false
      if (onlineOnly && !extras?.online) return false
      return searchGuide(item, needle)
    })
  }, [items, parsedMap, category, kind, onlineOnly, needle])

  const searching = needle.length > 0
  const popular = useMemo(() => featuredGuides(items), [items])
  const scenarios = useMemo(() => scenarioGuides(items), [items])
  const recent = useMemo(() => readRecentGuides(items), [items])
  const onlineCount = items.filter((item) => parsedMap.get(item.id)?.extras.online).length

  const byCategory = useMemo(() => {
    const groups = new Map<string, number>()
    for (const item of items) {
      if (!item.category) continue
      groups.set(item.category, (groups.get(item.category) ?? 0) + 1)
    }
    return groups
  }, [items])

  function selectCategory(label: string) {
    setCategory(label)
    setQ('')
  }

  return (
    <PublicPage immersive className="pub--wide" title="Hizmet rehberi">
      <div className="hg">
        <header className="hg-hero">
          <p className="hg-kicker">Hizmet keşif merkezi</p>
          <h1>Aradığınız belediye hizmetini saniyeler içinde bulun.</h1>
          <p>
            Ne yapmak istediğinizi yazın; doğru işlemi anlayın, ardından e-belediye sayfasına geçin. Bu
            sayfa bir işlem masası değil, yönlendirme rehberidir.
          </p>
          <div className="hg-search">
            <label htmlFor="hg-q">Hangi işlemi yapmak istiyorsunuz?</label>
            <div className="hg-search-box">
              <SearchIcon />
              <input
                id="hg-q"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Vergi ödeme, imar durumu, nikah, spor randevusu, başvuru takibi…"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <p className="hg-live" aria-live="polite">
              {pending
                ? 'Aranıyor…'
                : searching
                  ? `${filtered.length} hizmet bulundu`
                  : `${filtered.length} hizmet listeleniyor`}
            </p>
          </div>
        </header>

        {error ? <div className="error-box">{error}</div> : null}

        <div className="hg-ruler" aria-label="Hizmet özeti">
          <p>
            <strong>{loading ? '—' : items.length}</strong>
            <span>Hizmet</span>
          </p>
          <p>
            <strong>{loading ? '—' : Math.max(0, categories.length - 1)}</strong>
            <span>Kategori</span>
          </p>
          <p>
            <strong>{loading ? '—' : onlineCount}</strong>
            <span>Online işlem</span>
          </p>
        </div>

        {kinds.length > 0 ? (
          <section className="hg-block" aria-labelledby="hg-kinds-title">
            <header className="hg-head">
              <p className="hg-kicker">Keşif</p>
              <h2 id="hg-kinds-title">Nasıl bir işlem arıyorsunuz?</h2>
            </header>
            <div className="hg-kinds" role="toolbar" aria-label="İşlem türü">
              <button
                type="button"
                className={kind === 'Tümü' ? 'is-on' : ''}
                aria-pressed={kind === 'Tümü'}
                onClick={() => setKind('Tümü')}
              >
                Tümü
              </button>
              {kinds.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={kind === label ? 'is-on' : ''}
                  aria-pressed={kind === label}
                  onClick={() => setKind(label)}
                >
                  {label}
                </button>
              ))}
              {onlineCount > 0 ? (
                <button
                  type="button"
                  className={onlineOnly ? 'is-on' : ''}
                  aria-pressed={onlineOnly}
                  onClick={() => setOnlineOnly((value) => !value)}
                >
                  Online yapılabilir
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="hg-block" aria-labelledby="hg-index-title">
          <header className="hg-head">
            <p className="hg-kicker">{searching ? 'Sonuçlar' : 'Fihrist'}</p>
            <h2 id="hg-index-title">{searching ? 'Arama sonuçları' : 'Kategoriye göre keşfedin'}</h2>
          </header>
          <div className="hg-index">
            <nav className="hg-toc" aria-label="Hizmet kategorileri">
              {categories.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={category === label && !searching ? 'is-on' : ''}
                  aria-pressed={category === label}
                  onClick={() => selectCategory(label)}
                >
                  <span>{label === 'Tümü' ? '00' : String(index).padStart(2, '0')}</span>
                  <strong>{label}</strong>
                  <em>{label === 'Tümü' ? items.length : (byCategory.get(label) ?? 0)}</em>
                </button>
              ))}
            </nav>
            <div className="hg-ledger">
              {loading ? <p className="hg-muted">Hizmetler yükleniyor…</p> : null}
              {!loading && filtered.length === 0 ? (
                <div className="hg-empty">
                  <strong>Aradığınız hizmeti bulamadık.</strong>
                  <p>Kategori seçerek hizmetleri keşfetmeyi deneyin veya vergi, imar, nikah, spor yazın.</p>
                </div>
              ) : (
                <ul>
                  {filtered.map((item) => {
                    const extras = parsedMap.get(item.id)?.extras
                    return (
                      <li key={item.id}>
                        <Link to={guideHref(item)}>
                          <KindMark kind={extras?.kind} />
                          <span>
                            <strong>{item.title}</strong>
                            <em>
                              {item.category}
                              {extras?.online ? ' · Online' : ''}
                              {extras?.requiresAuth && !isAuthenticated ? ' · Giriş gerekir' : ''}
                            </em>
                            <em className="hg-blurb">{item.summary}</em>
                          </span>
                          <span className="hg-go">Hizmeti incele</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        {!searching && recent.length > 0 ? (
          <section className="hg-block" aria-labelledby="hg-recent-title">
            <header className="hg-head">
              <p className="hg-kicker">Bu oturum</p>
              <h2 id="hg-recent-title">Son incelediğiniz hizmetler</h2>
            </header>
            <ol className="hg-strip">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link to={guideHref(item)}>{item.title}</Link>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {!searching && popular.length > 0 ? (
          <section className="hg-block" aria-labelledby="hg-popular-title">
            <header className="hg-head">
              <p className="hg-kicker">Sık arananlar</p>
              <h2 id="hg-popular-title">Vatandaşların en çok baktığı hizmetler</h2>
            </header>
            <ol className="hg-popular">
              {popular.map((item, index) => {
                const extras = parsedMap.get(item.id)?.extras
                return (
                  <li key={item.id}>
                    <Link to={guideHref(item)}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{item.title}</strong>
                      <KindMark kind={extras?.kind} />
                    </Link>
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}

        {!searching && scenarios.length > 0 ? (
          <section className="hg-block" aria-labelledby="hg-ask-title">
            <header className="hg-head">
              <p className="hg-kicker">Vatandaş dili</p>
              <h2 id="hg-ask-title">Ne yapmak istiyorsunuz?</h2>
            </header>
            <ul className="hg-ask">
              {scenarios.map(({ question, item }) => (
                <li key={item.id}>
                  <Link to={guideHref(item)}>
                    <q>{question}</q>
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <aside className="hg-bridge">
          <p className="hg-kicker">Yönlendirme</p>
          <h2>Hizmeti bulduysanız işlemi E-Belediye’de başlatın.</h2>
          <p>
            Rehber hangi sayfaya gideceğinizi gösterir. Ödeme, başvuru ve randevu masası E-Belediye
            üzerindedir.
          </p>
          <Link className="btn btn-primary" to="/e-belediye">
            E-Belediye’ye geç
          </Link>
        </aside>

        <section className="hg-block" aria-labelledby="hg-help-title">
          <header className="hg-head">
            <p className="hg-kicker">Destek</p>
            <h2 id="hg-help-title">Yardıma mı ihtiyacınız var?</h2>
          </header>
          <div className="hg-help">
            <Link to="/iletisim">
              <strong>İletişim</strong>
              <span>Yazışma formu ve demo çağrı hattı</span>
            </Link>
            <Link to="/basvuru-takip">
              <strong>Başvuru takibi</strong>
              <span>BV-, SP- veya NK- kodu ile durum sorun</span>
            </Link>
            <Link to={isAuthenticated ? '/talepler' : loginPath('/talepler')}>
              <strong>Talep / öneri</strong>
              <span>Şikâyet ve öneri kaydı açın</span>
            </Link>
          </div>
        </section>

        <nav className="hg-continue" aria-label="Belediyeyi keşfetmeye devam edin">
          <p className="hg-kicker">Keşfetmeye devam edin</p>
          <div>
            {CONTINUE.map((item) => (
              <Link key={item.to} to={item.to}>
                <em>{item.kicker}</em>
                <strong>{item.title}</strong>
                <span>{item.hint}</span>
              </Link>
            ))}
          </div>
        </nav>

        <p className="hg-note">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}

export function ServiceGuideDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const [item, setItem] = useState<PortalContent | null>(null)
  const [pool, setPool] = useState<PortalContent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setItem(null)
    setError(null)
    void (async () => {
      try {
        const path = isGuideId(id) ? `/api/v1/portal/${id}` : `/api/v1/portal/by-slug/${id}`
        const [guide, page] = await Promise.all([
          apiFetch<PortalContent>(path),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=ServiceGuide&pageSize=50'),
        ])
        if (cancelled) return
        setItem(guide)
        setPool(page.items)
        rememberGuide(guide.slug)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Hizmet yüklenemedi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="container page">
        <div className="error-box">{error}</div>
        <p>
          <Link to="/hizmet-rehberi">Hizmet rehberine dön</Link>
        </p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="container page">
        <p className="muted">Hizmet yükleniyor…</p>
      </div>
    )
  }

  const parsed = parseGuideBody(item.body)
  const extras = parsed.extras
  const cover = coverForGuide(item)
  const related = relatedGuides(item, pool)
  const steps = extras.steps.length > 0 ? extras.steps : defaultGuideSteps(extras.kind)
  const href = actionHref(extras.route, extras.requiresAuth, isAuthenticated)

  return (
    <PublicPage immersive className="pub--wide" title={item.title}>
      <div className="hg hg-detail">
        <Link className="hg-back" to="/hizmet-rehberi">
          ← Hizmet rehberi
        </Link>
        <header className="hgd-hero">
          <div>
            <p className="hg-kicker">Hizmet kartı</p>
            <h1>{item.title}</h1>
            <p>{item.summary}</p>
            <div className="hgd-meta">
              <KindMark kind={extras.kind} />
              {item.category ? <span>{item.category}</span> : null}
              {extras.online ? <span>Online yapılabilir</span> : null}
              {extras.requiresAuth ? <span>Giriş gerekir</span> : null}
            </div>
            {href ? (
              <Link className="btn btn-primary" to={href}>
                {extras.cta ?? 'İşleme git'}
              </Link>
            ) : null}
          </div>
          <figure>
            <img src={cover.src} alt={cover.alt} />
          </figure>
        </header>

        <div className="hgd-grid">
          <article className="hgd-prose">
            {parsed.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {parsed.sections
              .filter((section) => section.title !== 'Nasıl yapılır?')
              .map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </section>
            ))}
          </article>
          <aside>
            <section>
              <p className="hg-kicker">Nasıl yapılır?</p>
              <ol className="hgd-steps">
                {steps.map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>
            {href ? (
              <Link className="btn btn-primary" to={href}>
                {extras.cta ?? 'İşleme git'}
              </Link>
            ) : (
              <p className="hg-muted">Bu kayıt için bağlı bir işlem sayfası yok.</p>
            )}
            <p className="hg-note">{NOTICE}</p>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="hg-block" aria-labelledby="hgd-related-title">
            <header className="hg-head">
              <p className="hg-kicker">İlgili hizmetler</p>
              <h2 id="hgd-related-title">Bunlara da bakabilirsiniz</h2>
            </header>
            <ul className="hg-ask">
              {related.map((entry) => (
                <li key={entry.id}>
                  <Link to={guideHref(entry)}>
                    <q>{entry.summary}</q>
                    <span>{entry.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <nav className="hg-continue" aria-label="Belediyeyi keşfetmeye devam edin">
          <p className="hg-kicker">Keşfetmeye devam edin</p>
          <div>
            {CONTINUE.map((entry) => (
              <Link key={entry.to} to={entry.to}>
                <em>{entry.kicker}</em>
                <strong>{entry.title}</strong>
                <span>{entry.hint}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </PublicPage>
  )
}
