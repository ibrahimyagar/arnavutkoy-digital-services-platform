import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PublicPage } from '../components/ui/PublicPage'
import { apiFetch, type Debt, type DocumentApplication, type Paginated, type PortalContent, type SportsAppointment } from '../lib/api'
import {
  DIGITAL_SERVICES,
  featuredServices,
  presentCategories,
  quickServices,
  searchServices,
  servicesInCategory,
  type DigitalService,
  type ServiceIcon,
} from '../lib/eBelediyeServices'
import { loginPath } from '../lib/returnUrl'
import './ebelediye.css'

const NOTICE =
  'Bu proje portföy amaçlı hazırlanmış bir demo uygulamadır. Resmi belediye hizmeti değildir; ödeme ve başvuru kayıtları örnek ortamdadır.'

function hrefFor(service: DigitalService, signedIn: boolean): string {
  return service.requiresAuth && !signedIn ? loginPath(service.to) : service.to
}

function SearchIcon() {
  return (
    <svg className="eb-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ServiceGlyph({ name }: { name: ServiceIcon }) {
  const common = {
    className: 'eb-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (name) {
    case 'pay':
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M3.5 10h17M8 14h3" />
        </svg>
      )
    case 'track':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      )
    case 'debt':
      return (
        <svg {...common}>
          <path d="M5 19V8l7-4 7 4v11" />
          <path d="M9 19v-6h6v6" />
        </svg>
      )
    case 'doc':
      return (
        <svg {...common}>
          <path d="M7 4.5h7l4 4V19.5H7z" />
          <path d="M14 4.5V9h4M9 13h6M9 16h4" />
        </svg>
      )
    case 'ring':
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="5.5" />
          <path d="M9.5 9.2 12 5.5 14.5 9.2" />
        </svg>
      )
    case 'plot':
      return (
        <svg {...common}>
          <path d="M4.5 19.5V9.5L12 4.5l7.5 5v10z" />
          <path d="M9 19.5v-6h6v6" />
        </svg>
      )
    case 'sport':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M5.5 9.5h13M5.5 14.5h13M12 4v16" />
        </svg>
      )
    case 'bus':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="12" rx="2" />
          <path d="M7 17v2M17 17v2M4 12h16" />
        </svg>
      )
    case 'aid':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.2-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.8-7 10-7 10z" />
        </svg>
      )
    case 'guide':
      return (
        <svg {...common}>
          <path d="M6 5.5h12v13H6z" />
          <path d="M9 9h6M9 12.5h6M9 16h3" />
        </svg>
      )
    case 'desk':
      return (
        <svg {...common}>
          <path d="M5 6h14v10H9l-4 3V16H5z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5M12 16.5h.01" />
        </svg>
      )
  }
}

function Block({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="eb-block">
      <header>
        <p className="eb-kicker">{kicker}</p>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}

export function EBelediyeHubPage() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [code, setCode] = useState('')
  const [guideCount, setGuideCount] = useState<number | null>(null)
  const [docs, setDocs] = useState<number | null>(null)
  const [openDebts, setOpenDebts] = useState<number | null>(null)
  const [sports, setSports] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=ServiceGuide&pageSize=1')
      .then((page) => {
        if (!cancelled) setGuideCount(page.totalCount)
      })
      .catch(() => {
        if (!cancelled) setGuideCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setDocs(null)
      setOpenDebts(null)
      setSports(null)
      return
    }
    let cancelled = false
    void Promise.allSettled([
      apiFetch<DocumentApplication[]>('/api/v1/e-services/documents/mine', {}, true),
      apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true),
      apiFetch<SportsAppointment[]>('/api/v1/e-services/sports/mine', {}, true),
    ]).then(([docRes, debtRes, sportRes]) => {
      if (cancelled) return
      setDocs(docRes.status === 'fulfilled' ? docRes.value.length : null)
      setOpenDebts(
        debtRes.status === 'fulfilled'
          ? debtRes.value.items.filter((row) => row.status === 'Unpaid').length
          : null,
      )
      setSports(sportRes.status === 'fulfilled' ? sportRes.value.length : null)
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const categories = presentCategories()
  const hits = useMemo(() => searchServices(q), [q])
  const deskItems = q.trim() ? hits : servicesInCategory(category)
  const quick = quickServices()
  const featured = featuredServices()
  const searching = q.trim().length > 0

  const stats = {
    services: DIGITAL_SERVICES.length,
    categories: categories.length - 1,
    guide: guideCount,
  }

  function onTrack(event: FormEvent) {
    event.preventDefault()
    const value = code.trim()
    if (!value) return
    navigate(`/basvuru-takip?kod=${encodeURIComponent(value)}`)
  }

  return (
    <PublicPage immersive className="pub--wide" title="E-Belediye">
      <div className="eb">
        <header className="eb-hero">
          <div className="eb-hero-copy">
            <p className="eb-kicker">Dijital belediye merkezi</p>
            <h1>E-Belediye</h1>
            <p>Belediye işlemlerinizi tek merkezden yönetin. Hizmeti arayın, başlatın, kodunuzla takip edin.</p>
          </div>
          <div className="eb-search">
            <label htmlFor="eb-q">Ne yapmak istiyorsunuz?</label>
            <div className="eb-search-box">
              <SearchIcon />
              <input
                id="eb-q"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Vergi ödeme, nikah başvurusu, imar durumu, başvuru takibi…"
                autoComplete="off"
              />
            </div>
            {searching && hits.length > 0 ? (
              <ul className="eb-hits" role="listbox" aria-label="Hizmet sonuçları">
                {hits.map((item) => (
                  <li key={item.id}>
                    <Link to={hrefFor(item, isAuthenticated)}>
                      <ServiceGlyph name={item.icon} />
                      <span>
                        <strong>{item.title}</strong>
                        <em>{item.blurb}</em>
                      </span>
                      <span className="eb-kind">{item.kind}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {searching && hits.length === 0 ? (
              <div className="eb-empty">
                <strong>Bu ifadeyle eşleşen işlem bulunamadı.</strong>
                <p>Vergi, nikah, imar veya takip yazmayı deneyin; ya da hizmet rehberine geçin.</p>
              </div>
            ) : null}
          </div>
        </header>

        <div className="eb-pulse" aria-label="Hizmet özeti">
          <div>
            <strong>{stats.services}</strong>
            <span>Açık işlem</span>
          </div>
          <div>
            <strong>{stats.categories}</strong>
            <span>Hizmet grubu</span>
          </div>
          <div>
            <strong>{stats.guide ?? '—'}</strong>
            <span>Rehber kaydı</span>
          </div>
        </div>

        <Block kicker="Sık işlem" title="En çok kullanılanlar">
          <div className="eb-quick">
            {quick.map((item) => (
              <Link key={item.id} to={hrefFor(item, isAuthenticated)}>
                <ServiceGlyph name={item.icon} />
                <span className="eb-kind">{item.kind}</span>
                <strong>{item.title}</strong>
                <span>{item.blurb}</span>
              </Link>
            ))}
          </div>
        </Block>

        <Block kicker="Hizmet keşfi" title="İşlem masası">
          <div className="eb-explore">
            <nav className="eb-cats" aria-label="Hizmet grupları">
              {categories.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={category === label && !searching ? 'is-on' : ''}
                  aria-pressed={category === label && !searching}
                  onClick={() => {
                    setCategory(label)
                    setQ('')
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="eb-desk">
              <h2>{searching ? 'Arama sonuçları' : category}</h2>
              {deskItems.length === 0 ? (
                <p className="eb-empty">Bu grupta gösterilecek işlem yok.</p>
              ) : (
                <ul className="eb-desk-list">
                  {deskItems.map((item) => (
                    <li key={item.id}>
                      <Link to={hrefFor(item, isAuthenticated)}>
                        <ServiceGlyph name={item.icon} />
                        <span>
                          <span className="eb-kind">{item.kind}</span>
                          <strong>{item.title}</strong>
                          <em className="eb-meta">{item.blurb}</em>
                          {item.requiresAuth && !isAuthenticated ? (
                            <em className="eb-meta"> Giriş gerekir.</em>
                          ) : null}
                        </span>
                        <span className="eb-go">İşleme git</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Block>

        <Block kicker="Öne çıkan" title="Bugün ihtiyacınız olabilir">
          <div className="eb-feature">
            <Link className="eb-lead" to={hrefFor(featured.lead, isAuthenticated)}>
              <ServiceGlyph name={featured.lead.icon} />
              <span className="eb-kind">{featured.lead.kind}</span>
              <h3>{featured.lead.title}</h3>
              <p>{featured.lead.blurb}</p>
              <span className="eb-go">İşleme git</span>
            </Link>
            <div className="eb-side">
              {featured.rest.map((item) => (
                <Link key={item.id} to={hrefFor(item, isAuthenticated)}>
                  <span className="eb-kind">{item.kind}</span>
                  <strong>{item.title}</strong>
                  <span className="eb-meta">{item.blurb}</span>
                </Link>
              ))}
            </div>
          </div>
        </Block>

        <section className="eb-track" aria-labelledby="eb-track-title">
          <div>
            <p className="eb-kicker">Başvurunu takip et</p>
            <h2 id="eb-track-title">Takip kodu ile durum</h2>
            <p className="eb-meta">BV-, SP- veya NK- kodunu yazın. Sorgulama mevcut takip servisine gider.</p>
            <form onSubmit={onTrack}>
              <div className="field">
                <label htmlFor="eb-code">Başvuru / takip kodunuz?</label>
                <input
                  id="eb-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Örn. BV-260811-1234"
                  autoComplete="off"
                />
              </div>
              <button className="btn btn-primary" type="submit">
                Durumu sorgula
              </button>
            </form>
          </div>
          <p className="eb-meta">
            Kodunuz yoksa önce belge, nikah veya spor işlemini başlatın. Demo ortamında gerçek resmi sonuç üretilmez.
          </p>
        </section>

        <Block kicker="Nasıl işler" title="Dört adım">
          <ol className="eb-flow">
            <li>
              <span>01</span>
              <strong>Hizmeti seç</strong>
              <em className="eb-meta">Arayın veya masadan tıklayın.</em>
            </li>
            <li>
              <span>02</span>
              <strong>İşlemi yap</strong>
              <em className="eb-meta">Başvuru, randevu veya ödeme.</em>
            </li>
            <li>
              <span>03</span>
              <strong>Kodu alın</strong>
              <em className="eb-meta">BV / SP / NK takip kodu.</em>
            </li>
            <li>
              <span>04</span>
              <strong>Sonucu izleyin</strong>
              <em className="eb-meta">Takip sayfasından durum.</em>
            </li>
          </ol>
        </Block>

        {isAuthenticated ? (
          <Block kicker="Hesabınız" title={`Benim işlemlerim · ${user?.fullName ?? ''}`}>
            <div className="eb-lanes">
              <Link to="/basvurular">
                <span className="eb-kind">Belge</span>
                <strong>Başvurularım</strong>
                <span>{docs === null ? '—' : `${docs} kayıt`}</span>
              </Link>
              <Link to="/borclar">
                <span className="eb-kind">Sorgulama</span>
                <strong>Ödemelerim</strong>
                <span>{openDebts === null ? '—' : `${openDebts} açık borç`}</span>
              </Link>
              <Link to="/spor-randevu">
                <span className="eb-kind">Randevu</span>
                <strong>Randevularım</strong>
                <span>{sports === null ? '—' : `${sports} spor kaydı`}</span>
              </Link>
            </div>
            <p>
              <Link to="/panel">Vatandaş paneline git →</Link>
            </p>
          </Block>
        ) : (
          <section className="eb-guest">
            <p className="eb-kicker">Kişisel alan</p>
            <h2>Kişisel işlemlerinizi tek yerden takip edin.</h2>
            <p className="eb-meta">Misafir olarak hizmetleri keşfedebilirsiniz. Vezne, borç ve belge için giriş gerekir.</p>
            <div className="eb-cta-row">
              <Link className="btn btn-primary" to={loginPath('/e-belediye')}>
                Giriş yap
              </Link>
              <Link className="btn btn-ghost" to="/kayit">
                Kayıt ol
              </Link>
            </div>
          </section>
        )}

        <Block kicker="Destek" title="Yardıma mı ihtiyacınız var?">
          <div className="eb-help-grid">
            <Link to="/iletisim">
              <strong>İletişim</strong>
              <span className="eb-meta">Yazışma formu</span>
            </Link>
            <Link to={isAuthenticated ? '/talepler' : loginPath('/talepler')}>
              <strong>Talep / öneri</strong>
              <span className="eb-meta">Kayıt açın</span>
            </Link>
            <Link to="/basvuru-takip">
              <strong>Başvuru takibi</strong>
              <span className="eb-meta">Kod ile sorgulayın</span>
            </Link>
            <Link to="/hizmet-rehberi">
              <strong>Hizmet rehberi</strong>
              <span className="eb-meta">Size uygun işlemi bulun</span>
            </Link>
          </div>
        </Block>

        <nav className="eb-bar" aria-label="Hızlı erişim">
          <Link to="/basvuru-takip">Başvuru takibi →</Link>
          <Link to={hrefFor(featured.lead, isAuthenticated)}>Dijital vezne →</Link>
          <Link to={isAuthenticated ? '/borclar' : loginPath('/borclar')}>Borç sorgulama →</Link>
          <Link to="/hizmet-rehberi">Hizmet rehberi →</Link>
          <Link to="/iletisim">İletişim →</Link>
        </nav>

        <p className="eb-notice">{NOTICE}</p>
      </div>
    </PublicPage>
  )
}
