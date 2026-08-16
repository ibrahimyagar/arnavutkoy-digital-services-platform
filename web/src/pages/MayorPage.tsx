import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type Paginated, type PortalContent } from '../lib/api'
import { COVERS } from '../lib/contentVisuals'
import './mayor.css'

const NOTICE =
  'Bu sayfadaki kişi, mesajlar ve iletişim bilgileri kurgusaldır. Resmi bir belediye başkanlığı sayfası değildir.'

const LEAD = 'Kurumsal mesaj alanı — portföy demosudur, resmi makam değildir.'

const MESSAGE_FALLBACK =
  'Arnavutköy’de dijital hizmetleri tek portalda sunmak için bu örnek platform geliştirildi. Tüm içerikler kurgusaldır; resmi kurumla bağlantısı yoktur.'

const PRIORITIES = [
  {
    n: '01',
    title: 'Dijital belediyecilik',
    body: 'Vatandaşın belediye hizmetlerine daha az kapı dolaşarak erişmesi. İşlemler demo ortamındadır.',
    to: '/e-belediye',
    action: 'E-Belediye',
  },
  {
    n: '02',
    title: 'Erişilebilir hizmetler',
    body: 'Süreçlerin sade, anlaşılır ve mahalle ölçeğinde görünür sunulması.',
    to: '/hizmet-rehberi',
    action: 'Hizmet rehberi',
  },
  {
    n: '03',
    title: 'Şeffaf iletişim',
    body: 'Duyuru, başvuru ve yanıtın aynı dilde, takip edilebilir kanallarda durması.',
    to: '/duyurular',
    action: 'Duyurular',
  },
  {
    n: '04',
    title: 'Sürdürülebilir kent',
    body: 'Çevre, park ve kent yaşamını destekleyen örnek çalışmalar — resmi faaliyet listesi değildir.',
    to: '/faaliyetler',
    action: 'Faaliyetler',
  },
]

const CADENCE = [
  { n: '01', word: 'Dinle', hint: 'Talep ve mahalle sesi' },
  { n: '02', word: 'Anla', hint: 'Süreci sadeleştir' },
  { n: '03', word: 'Çöz', hint: 'Birime yönlendir' },
  { n: '04', word: 'Geliştir', hint: 'Deneyimi ölç' },
]

const AGENDA = [
  {
    title: 'Dijital hizmetler',
    body: 'Vatandaş deneyiminin sadeleştirilmesi. Bu madde güncel resmi gündem değildir.',
    to: '/e-belediye',
  },
  {
    title: 'Kent yaşamı',
    body: 'Mahalle ve çevre odaklı hizmet anlatısı. Örnek öncelik metnidir.',
    to: '/muhtarliklar',
  },
  {
    title: 'Sosyal belediyecilik',
    body: 'Destek ve yönlendirme kanallarının görünür kılınması. Demo bağlamıdır.',
    to: '/yardim',
  },
]

const RELATED = [
  { title: 'Kurumsal yapı', hint: 'Belediyenin organizasyonunu keşfedin.', to: '/kurumsal' },
  { title: 'Birimler', hint: 'Müdürlük ve personel yapısını inceleyin.', to: '/birimler' },
  { title: 'İletişim', hint: 'Belediye ile yazışın.', to: '/iletisim' },
  { title: 'Duyurular', hint: 'Güncel bilgilendirmeleri inceleyin.', to: '/duyurular' },
]

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mark = () => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.94) setVisible(true)
    }
    mark()
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.06, rootMargin: '0px 0px 16% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`ldr-reveal${visible ? ' is-in' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

export function MayorPage() {
  const [item, setItem] = useState<PortalContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Mayor&pageSize=1')
        if (!cancelled) setItem(page.items[0] ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const quote = item?.body?.trim() || MESSAGE_FALLBACK
  const quoteTitle = item?.title ?? 'Başkanın mesajı'

  return (
    <div className="ldr">
      <header className="ldr-hero">
        <div className="ldr-hero-copy">
          <p className="ldr-kicker">Başkanlık</p>
          <h1>
            Birlikte daha erişilebilir,
            <em> daha hızlı ve daha yaşanabilir bir Arnavutköy.</em>
          </h1>
          <p className="ldr-lead">{LEAD}</p>
          <p className="ldr-notice">
            <strong>Demo / portföy projesi.</strong> {NOTICE}
          </p>
        </div>
        <figure className="ldr-hero-mark" aria-hidden>
          <img src={COVERS.mayor.src} alt="" />
          <span />
        </figure>
      </header>

      <Reveal>
        <section className="ldr-quote" aria-labelledby="ldr-quote-title">
          <p className="ldr-kicker" id="ldr-quote-title">
            {quoteTitle}
          </p>
          {error ? <div className="error-box">{error}</div> : null}
          {loading && !item ? (
            <p className="ldr-wait">Yükleniyor…</p>
          ) : (
            <blockquote>
              <span aria-hidden>“</span>
              <p>{quote}</p>
            </blockquote>
          )}
          <p className="ldr-sign">
            <strong>Demo Başkanlık</strong>
            Portföy projesi · gerçek makam değildir
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="ldr-priorities" aria-labelledby="ldr-pri-title">
          <header>
            <p className="ldr-kicker">Öncelikler</p>
            <h2 id="ldr-pri-title">Mesajın dayandığı dört çizgi.</h2>
          </header>
          <ol>
            {PRIORITIES.map((row) => (
              <li key={row.n}>
                <span>{row.n}</span>
                <div>
                  <h3>{row.title}</h3>
                  <p>{row.body}</p>
                  <Link to={row.to}>{row.action} →</Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="ldr-cadence" aria-labelledby="ldr-cadence-title">
          <header>
            <p className="ldr-kicker">Yönetim yaklaşımı</p>
            <h2 id="ldr-cadence-title">Sözün ritmi.</h2>
          </header>
          <ol>
            {CADENCE.map((step) => (
              <li key={step.word}>
                <span>{step.n}</span>
                <strong>{step.word}.</strong>
                <em>{step.hint}</em>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="ldr-agenda" aria-labelledby="ldr-agenda-title">
          <header>
            <p className="ldr-kicker">Başkanlık gündemi</p>
            <h2 id="ldr-agenda-title">Örnek çalışma başlıkları.</h2>
            <p>Bu liste güncel resmi faaliyet gibi okunmamalıdır.</p>
          </header>
          <ul>
            {AGENDA.map((row) => (
              <li key={row.title}>
                <h3>{row.title}</h3>
                <p>{row.body}</p>
                <Link to={row.to}>İncele →</Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section className="ldr-bridge" aria-labelledby="ldr-bridge-title">
          <p className="ldr-kicker">Mesajdan hizmete</p>
          <h2 id="ldr-bridge-title">Anlatılan öncelik, ilgili kapıya gider.</h2>
          <p>
            Dijital işlemler için <Link to="/e-belediye">E-Belediye</Link>, yazışma için{' '}
            <Link to="/iletisim">iletişim formu</Link>, birim yapısı için{' '}
            <Link to="/birimler">birimler dizini</Link>, kamuoyu bilgisi için{' '}
            <Link to="/duyurular">duyurular</Link>.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="ldr-contact" aria-labelledby="ldr-contact-title">
          <div>
            <p className="ldr-kicker">İletişim</p>
            <h2 id="ldr-contact-title">Talep ve öneri.</h2>
            <p>
              Yanıt süreleri örnektir. Gerçek makam hattı veya kişi e-postası yayınlanmaz.
            </p>
          </div>
          <div className="ldr-contact-actions">
            <Link to="/iletisim">İletişim formuna git →</Link>
            <p>
              <span>Demo çağrı hattı</span>
              444 00 00
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <nav className="ldr-related" aria-labelledby="ldr-related-title">
          <p className="ldr-kicker">Başkanlıkla ilgili</p>
          <h2 id="ldr-related-title">Yanına bakın.</h2>
          <ul>
            {RELATED.map((row) => (
              <li key={row.to}>
                <Link to={row.to}>
                  <strong>{row.title}</strong>
                  <span>{row.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Reveal>
    </div>
  )
}
