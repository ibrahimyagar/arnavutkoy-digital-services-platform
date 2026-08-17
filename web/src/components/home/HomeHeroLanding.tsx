import { useId, useState, type CSSProperties } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BrandLogo } from '../BrandLogo'
import './home-hero-landing.css'

type HomeHeroLandingProps = {
  isAuthenticated: boolean
}

const NAV = [
  { to: '/', label: 'Ana Sayfa', end: true },
  { to: '/kurumsal', label: 'Kurumsal' },
  { to: '/hizmet-rehberi', label: 'Hizmetler' },
  { to: '/faaliyetler', label: 'Projeler' },
  { to: '/duyurular', label: 'Duyurular' },
  { to: '/iletisim', label: 'İletişim' },
] as const

const QUICK = [
  { to: '/duyurular', label: 'Duyurular', icon: 'announce' },
  { to: '/etkinlikler', label: 'Etkinlikler', icon: 'calendar' },
  { to: '/basvuru-takip', label: 'Başvuru Takibi', icon: 'track' },
  { to: '/nikah', label: 'Nikah İşlemleri', icon: 'rings' },
  { to: '/imar', label: 'İmar / Harç', icon: 'building' },
  { to: '/spor-randevu', label: 'Spor Randevu', icon: 'sport' },
  { to: '/iletisim', label: 'İletişim', icon: 'headset' },
  { to: '/hizmet-rehberi', label: 'Hizmet Rehberi', icon: 'book' },
] as const

function QuickIcon({ name }: { name: (typeof QUICK)[number]['icon'] }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'announce':
      return (
        <svg {...common}>
          <path d="M3 11v2a1 1 0 0 0 1 1h2l6 4V6L6 10H4a1 1 0 0 0-1 1Z" />
          <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3.5V7M16 3.5V7M3.5 10h17" />
        </svg>
      )
    case 'track':
      return (
        <svg {...common}>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="M5 6.2 6.2 7.4 8 5.2M5 12.2 6.2 13.4 8 11.2M5 18.2 6.2 19.4 8 17.2" />
        </svg>
      )
    case 'rings':
      return (
        <svg {...common}>
          <circle cx="9" cy="12" r="4.2" />
          <circle cx="15" cy="12" r="4.2" />
        </svg>
      )
    case 'building':
      return (
        <svg {...common}>
          <path d="M4 20h16M6 20V6.5A1.5 1.5 0 0 1 7.5 5h5A1.5 1.5 0 0 1 14 6.5V20M14 10h4.5A1.5 1.5 0 0 1 20 11.5V20" />
          <path d="M8.5 9h2M8.5 13h2M8.5 17h2" />
        </svg>
      )
    case 'sport':
      return (
        <svg {...common}>
          <circle cx="14.5" cy="5.5" r="2" />
          <path d="M8 21l2.2-5.2L14 14l2 3.5 3-1.5M6.5 12.5 10 14l3-4.5 2.8 1.2" />
        </svg>
      )
    case 'headset':
      return (
        <svg {...common}>
          <path d="M4.5 12a7.5 7.5 0 0 1 15 0" />
          <path d="M4.5 12v4.5A1.5 1.5 0 0 0 6 18h1.5v-6H6A1.5 1.5 0 0 0 4.5 12ZM19.5 12v4.5A1.5 1.5 0 0 1 18 18h-1.5v-6H18a1.5 1.5 0 0 1 1.5 1.5" />
          <path d="M16.5 18v.8A2.7 2.7 0 0 1 13.8 21.5H12" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19v15H6.5A2 2 0 0 0 4.5 20.5v-15Z" />
          <path d="M4.5 18.5A2 2 0 0 1 6.5 16.5H19" />
        </svg>
      )
    default:
      return null
  }
}

export function HomeHeroLanding({ isAuthenticated }: HomeHeroLandingProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  return (
    <section className="hl-hero" aria-label="Ana tanıtım">
      <div className="hl-hero-bg" role="img" aria-label="Arnavutköy manzarası" />
      <div className="hl-hero-shade" aria-hidden />

      <header className="hl-nav">
        <Link to="/" className="hl-brand">
          <BrandLogo className="hl-brand-mark" />
          <span className="hl-brand-text">
            <strong>ARNAVUTKÖY</strong>
            <small>BELEDİYESİ</small>
          </span>
        </Link>

        <nav className="hl-nav-links" aria-label="Ana menü">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={'end' in item ? item.end : false}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hl-nav-actions">
          <Link className="hl-btn hl-btn--ghost" to="/e-belediye">
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="5" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M8 19h8M12 17v2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            e-Belediye
          </Link>
          <Link className="hl-btn hl-btn--solid" to={isAuthenticated ? '/panel' : '/giris'}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M5.5 19.2c1.6-3 4-4.5 6.5-4.5s4.9 1.5 6.5 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            {isAuthenticated ? 'Panel' : 'Giriş Yap'}
          </Link>
          <button
            type="button"
            className="hl-burger"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span data-open={menuOpen} />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div id={menuId} className="hl-drawer" role="dialog" aria-label="Mobil menü">
          <nav>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/e-belediye" onClick={() => setMenuOpen(false)}>
              e-Belediye
            </Link>
            <Link to={isAuthenticated ? '/panel' : '/giris'} onClick={() => setMenuOpen(false)}>
              {isAuthenticated ? 'Panel' : 'Giriş Yap'}
            </Link>
          </nav>
        </div>
      ) : null}

      <div className="hl-body">
        <div className="hl-copy">
          <p className="hl-kicker">Hadımköy&apos;den Durusu&apos;ya</p>
          <h1 lang="tr">
            <span className="hl-title">ARNAVUTKÖY</span>
            <span className="hl-script">Seninle Güzel</span>
          </h1>
          <p className="hl-lead">
            İstanbul&apos;un yükselen değeri Arnavutköy&apos;de yaşam, hizmet ve geleceği birlikte inşa
            ediyoruz.
          </p>
          <div className="hl-cta">
            <Link className="hl-btn hl-btn--solid hl-btn--lg" to="/e-belediye">
              e-Belediye
              <span aria-hidden>→</span>
            </Link>
            <Link className="hl-btn hl-btn--ghost hl-btn--lg" to="/hizmet-rehberi">
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              Hizmetlerimiz
            </Link>
          </div>
        </div>

        <a className="hl-video" href="#home-content" aria-label="Tanıtım videosu — aşağı kaydır">
          <span className="hl-video-play" aria-hidden>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M10 8.5v7l6-3.5-6-3.5Z" fill="currentColor" />
            </svg>
          </span>
          <span>Tanıtım Videosu</span>
        </a>
      </div>

      <nav className="hl-dock" aria-label="Hızlı erişim">
        <div className="hl-dock-rail">
          {QUICK.map((item, index) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              className="hl-dock-item"
              style={{ '--i': index } as CSSProperties}
            >
              <span className="hl-dock-icon" aria-hidden>
                <QuickIcon name={item.icon} />
              </span>
              <span className="hl-dock-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <a className="hl-scroll" href="#home-content">
        <span className="hl-scroll-mouse" aria-hidden />
        Aşağı kaydırın
      </a>
    </section>
  )
}
