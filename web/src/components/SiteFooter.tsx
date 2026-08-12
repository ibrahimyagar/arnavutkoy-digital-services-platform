import { Link } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import './site-footer.css'

const COLUMNS = [
  {
    title: 'Kurumsal',
    links: [
      { label: 'Kurumsal', to: '/kurumsal' },
      { label: 'Başkan', to: '/baskan' },
      { label: 'Birimler', to: '/birimler' },
      { label: 'Bize ulaşın', to: '/iletisim' },
    ],
  },
  {
    title: 'İlçede yaşam',
    links: [
      { label: 'Muhtarlıklar', to: '/muhtarliklar' },
      { label: 'Kültür & sanat', to: '/kultur' },
      { label: 'Ulaşım ağı', to: '/ulasim-agi' },
      { label: 'Hizmet rehberi', to: '/hizmet-rehberi' },
    ],
  },
  {
    title: 'Güncel',
    links: [
      { label: 'Haberler', to: '/haberler' },
      { label: 'Duyurular', to: '/duyurular' },
      { label: 'Etkinlikler', to: '/etkinlikler' },
      { label: 'Faaliyetler', to: '/faaliyetler' },
    ],
  },
  {
    title: 'Hizmetler',
    links: [
      { label: 'E-Belediye', to: '/e-belediye' },
      { label: 'Dijital vezne', to: '/vezne' },
      { label: 'Nikah', to: '/nikah' },
      { label: 'İmar / harç', to: '/imar' },
      { label: 'Spor randevu', to: '/spor-randevu' },
      { label: 'Başvuru takibi', to: '/basvuru-takip' },
    ],
  },
  {
    title: 'Projeler',
    links: [
      { label: 'Faaliyetler', to: '/faaliyetler' },
      { label: 'Ulaşım ağı', to: '/ulasim-agi' },
      { label: 'Sosyal yardım', to: '/yardim' },
    ],
  },
] as const

/** Demo WhatsApp — portföy; gerçek kurum hattı değildir. */
const WHATSAPP_HREF = 'https://wa.me/905555000000?text=Merhaba%2C%20Arnavutk%C3%B6y%20dijital%20hizmetler%20demosunu%20inceledim.'

export function SiteFooter() {
  return (
    <>
      <footer className="site-footer" aria-label="Site alt bilgisi">
        <section className="sf-main">
          <div className="sf-inner sf-main-grid">
            <div className="sf-brand-block">
              <Link to="/" className="sf-logo">
                <BrandLogo className="sf-logo-mark" />
                <span>
                  <strong>ARNAVUTKÖY</strong>
                  <small>BELEDİYESİ</small>
                </span>
              </Link>

              <div className="sf-social" aria-label="Sosyal medya (demo)">
                <a
                  className="sf-social-btn"
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z"
                    />
                  </svg>
                </a>
                <a
                  className="sf-social-btn"
                  href="https://x.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="X"
                >
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M4 4h4.2l4 5.5L16.8 4H20l-6.1 7.2L20.2 20h-4.2l-4.3-5.9L7.2 20H4l6.4-7.5L4 4Z"
                    />
                  </svg>
                </a>
                <a
                  className="sf-social-btn"
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 2.8A4.2 4.2 0 1 1 7.8 12 4.2 4.2 0 0 1 12 7.8Zm0 2A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8Zm5.1-2.95a1 1 0 1 1-1 1 1 1 0 0 1 1-1Z"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="sf-contact">
              <a className="sf-phone" href="tel:4440000">
                444 00 00
              </a>
              <p className="sf-phone-note">Çağrı merkezi · demo hat</p>
              <div className="sf-contact-links">
                <Link to="/talepler">Talep ve öneri</Link>
                <Link to="/iletisim">İletişim</Link>
                <Link to="/basvuru-takip">Başvuru takibi</Link>
              </div>
            </div>

            <div className="sf-columns">
              {COLUMNS.map((col) => (
                <div key={col.title} className="sf-col">
                  <h2>{col.title}</h2>
                  <ul>
                    {col.links.map((link) => (
                      <li key={link.to + link.label}>
                        <Link to={link.to}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="sf-bar">
          <div className="sf-inner sf-bar-row">
            <p>Arnavutköy Dijital Hizmetler · portföy demosu © {new Date().getFullYear()}</p>
            <p className="sf-disclaimer">
              Resmi Arnavutköy Belediyesi ile bağlantısı yoktur. Tüm veriler kurgusaldır.
            </p>
          </div>
        </div>
      </footer>

      <a
        className="sf-whatsapp"
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="WhatsApp iletişim (demo)"
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.9 12.5l-.3.4.8 2.9-3-.8-.4.2A8.2 8.2 0 1 1 12 3.8Zm4.6 10.7c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9 5 5 0 0 0 2.9.7 2.5 2.5 0 0 0 1.7-1.1 2 2 0 0 0 .1-1.1c-.1-.1-.2-.1-.4-.2Z"
          />
        </svg>
        <span>WhatsApp İletişim</span>
      </a>
    </>
  )
}
