import { Link } from 'react-router-dom'
import { PUBLIC_MODULES, type ModuleTile } from '../../lib/modules'
import { coverForModuleId } from '../../lib/contentVisuals'
import './home-sections.css'

export type QuickLink = {
  id: string
  title: string
  to: string
}

export const HOME_QUICK_LINKS: QuickLink[] = [
  { id: 'news', title: 'Haberler', to: '/haberler' },
  { id: 'events', title: 'Etkinlikler', to: '/etkinlikler' },
  { id: 'track', title: 'Başvuru takibi', to: '/basvuru-takip' },
  { id: 'marriage', title: 'Nikah', to: '/nikah' },
  { id: 'zoning', title: 'İmar / harç', to: '/imar' },
  { id: 'sport', title: 'Spor randevu', to: '/spor-randevu' },
  { id: 'contact', title: 'İletişim', to: '/iletisim' },
  { id: 'guide', title: 'Hizmet rehberi', to: '/hizmet-rehberi' },
]

const FEATURE_IDS = [
  'e-belediye',
  'news',
  'announcements',
  'events',
  'projects',
  'culture',
  'service-guide',
  'mayor',
] as const

const FEATURE_TONE: Record<string, 'teal' | 'navy' | 'blue' | 'sand'> = {
  'e-belediye': 'teal',
  news: 'navy',
  announcements: 'blue',
  events: 'teal',
  projects: 'sand',
  culture: 'navy',
  'service-guide': 'blue',
  mayor: 'teal',
}

export function getHomeFeatureModules(): ModuleTile[] {
  return FEATURE_IDS.map((id) => PUBLIC_MODULES.find((m) => m.id === id)).filter(
    (m): m is ModuleTile => Boolean(m),
  )
}

function QuickIcon({ title }: { title: string }) {
  return (
    <span className="home-quick-icon" aria-hidden>
      {title.charAt(0)}
    </span>
  )
}

export function HomeQuickLinks() {
  return (
    <section id="hizli-erisim" className="home-quick" aria-label="Hızlı erişim">
      <div className="container">
        <header className="home-section-head">
          <h2>Hızlı erişim</h2>
          <p className="muted">Sık kullanılan işlemler — sade kısayollar</p>
        </header>
        <div className="home-quick-grid">
          {HOME_QUICK_LINKS.map((item, index) => (
            <Link
              key={item.id}
              to={item.to}
              className={`home-quick-card tone-${['teal', 'blue', 'orange', 'teal', 'blue', 'orange', 'teal', 'blue'][index] ?? 'teal'}`}
            >
              <QuickIcon title={item.title} />
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HomeFeatureCards({ modules }: { modules: ModuleTile[] }) {
  return (
    <section className="home-features" aria-label="Öne çıkan hizmetler">
      <div className="container">
        <header className="home-section-head home-features-head">
          <h2>Belediye hizmetleri</h2>
          <p className="muted">Kurumsal bilgi ve e-hizmetlere tek noktadan ulaşın</p>
        </header>
        <div className="home-feature-grid">
          {modules.map((mod) => {
            const visual = coverForModuleId(mod.id)
            const tone = FEATURE_TONE[mod.id] ?? 'teal'
            return (
              <Link key={mod.id} to={mod.to} className={`home-feature-card tone-${tone}`}>
                <div className="home-feature-media">
                  {visual ? (
                    <img src={visual.src} alt={visual.alt} loading="lazy" decoding="async" />
                  ) : null}
                  <span className="home-feature-shade" aria-hidden />
                </div>
                <div className="home-feature-copy">
                  <h3>{mod.title}</h3>
                  <p>{mod.description}</p>
                </div>
                <span className="home-feature-go" aria-hidden>
                  →
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HomeAnnouncements({
  items,
}: {
  items: {
    id: string
    title: string
    dateLabel: string
    to: string
    category: string
    image: string
    excerpt: string
  }[]
}) {
  if (items.length === 0) return null
  return (
    <section className="home-announcements" aria-labelledby="home-ann-title">
      <div className="container">
        <header className="home-section-head home-section-head--row">
          <div>
            <h2 id="home-ann-title">Güncel duyurular</h2>
            <p className="muted">Yayımlanmış resmi bülten — kurgusal demo içerik.</p>
          </div>
          <Link className="btn btn-ghost" to="/duyurular">
            Tümü
          </Link>
        </header>
        <div className="home-announcements-grid">
          {items.map((item) => (
            <Link key={item.id} to={item.to} className="home-announcement">
              <span className="home-announcement-media" aria-hidden>
                <img src={item.image} alt="" />
              </span>
              <span className="home-announcement-copy">
                <em>{item.category}</em>
                <time>{item.dateLabel}</time>
                <strong>{item.title}</strong>
                <span>{item.excerpt}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
