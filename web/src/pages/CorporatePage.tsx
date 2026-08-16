import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, type Department, type Neighborhood, type Paginated, type PortalContent } from '../lib/api'
import { COVERS } from '../lib/contentVisuals'
import { departmentCategory } from '../lib/hrVisuals'
import { isOfficialNeighborhood } from '../lib/neighborhoodVisuals'
import './corporate.css'

const WHO_WE_ARE = `Arnavutköy Belediyesi, ilçenin yaşam kalitesini artırmak, sürdürülebilir kent gelişimini desteklemek ve vatandaşlara erişilebilir kamu hizmetleri sunmak amacıyla çalışmalarını sürdürür.

Bu metin portföy demosudur; resmi kurum yayını değildir. Amaç, vatandaşın belediyenin kimliğini, yönetim anlayışını ve organizasyon katmanlarını tek bakışta tanımasıdır.`

const MAYOR_FALLBACK =
  'Dijital başvuru, şeffaf duyuru ve mahalle ölçeğinde erişilebilir hizmet aynı deneyimde toplanır. Bu mesaj kurgusal bir arayüz örneğidir; gerçek makam metni değildir.'

const DIGITAL_SERVICE_COUNT = 8

type OrgLayerId = 'baskanlik' | 'yardimci' | 'mudurluk' | 'hizmet'

const VALUES = [
  { n: '01', title: 'Erişilebilirlik', body: 'Hizmetler, vatandaşın dilinde ve ulaşılabilir kanallarda sunulur.' },
  { n: '02', title: 'Şeffaflık', body: 'Duyuru, süreç ve yönlendirme görünür kılınır; belirsizlik azaltılır.' },
  { n: '03', title: 'Yakınlık', body: 'Mahalle ve birim ölçeği korunur; merkezî işlem vatandaşı uzaklaştırmaz.' },
  { n: '04', title: 'Sürdürülebilirlik', body: 'Kent gelişimi, yeşil alan ve dijital hizmet aynı bakışla ele alınır.' },
]

const STORY = [
  {
    era: 'Geçmiş',
    title: 'İlçe kimliği',
    body: 'Arnavutköy’ün yerleşim, tarım ve kıyı hattı birlikte okunur. Bu blok tarihçe iddiası taşımaz; ilçeyi tanıtan örnek bir anlatıdır.',
  },
  {
    era: 'Gelişim',
    title: 'Kent dokusu',
    body: 'Mahalleler büyüdükçe yol, park ve sosyal tesis ihtiyacı artar. Gelişim burada yatırım listesi değil, kurumun ölçek değişimini anlatır.',
  },
  {
    era: 'Bugün',
    title: 'Dijital belediye',
    body: 'Başvuru, vezne, duyuru ve birim dizini aynı portalda toplanır. Süreçler demo veridir; gerçek resmi işlem üretmez.',
  },
  {
    era: 'Gelecek',
    title: 'Ortak tasarım',
    body: 'Yarın, vatandaşın daha az kapı dolaştığı ve kararların daha görünür olduğu bir hizmet ağı olarak kurgulanır.',
  },
]

const DISCOVER = [
  { n: '01', title: 'Başkanlık', hint: 'Kurumsal mesaj ve öncelikler', to: '/baskan' },
  { n: '02', title: 'Birimler ve personel', hint: 'Müdürlük dizini ve iletişim', to: '/birimler' },
  { n: '03', title: 'Muhtarlıklar', hint: 'Mahalle, nüfus ve muhtar hattı', to: '/muhtarliklar' },
  { n: '04', title: 'Hizmet rehberi', hint: 'Sık kullanılan işlemlere kısa yol', to: '/hizmet-rehberi' },
  { n: '05', title: 'E-Belediye', hint: 'Vezne, belge, nikah ve imar', to: '/e-belediye' },
  { n: '06', title: 'Basın ve medya', hint: 'Haber akışı ve kamuoyu bilgisi', to: '/haberler' },
  { n: '07', title: 'Duyurular', hint: 'Resmi bildirim ve süreler', to: '/duyurular' },
  { n: '08', title: 'İletişim', hint: 'Form, çağrı ve yazışma', to: '/iletisim' },
]

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const markIfNear = () => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.94) setVisible(true)
    }
    markIfNear()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.05, rootMargin: '0px 0px 18% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function useCountUp(value: number, active: boolean) {
  const [shown, setShown] = useState(value)
  const primed = useRef(false)

  useEffect(() => {
    if (value <= 0) {
      setShown(0)
      return
    }

    if (!primed.current || !active || prefersReducedMotion()) {
      primed.current = value > 0
      setShown(value)
      return
    }

    const duration = 720
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setShown(Math.round(value * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, value])

  return shown
}

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className={`ins-reveal${visible ? ' is-in' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

export function CorporatePage() {
  const [corporate, setCorporate] = useState<PortalContent | null>(null)
  const [mayor, setMayor] = useState<PortalContent | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [layer, setLayer] = useState<OrgLayerId>('baskanlik')
  const [loading, setLoading] = useState(true)
  const stats = useInView<HTMLDivElement>()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [corpPage, mayorPage, deps, hoods] = await Promise.all([
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Corporate&pageSize=1').catch(() => null),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Mayor&pageSize=1').catch(() => null),
          apiFetch<Department[]>('/api/v1/departments').catch(() => [] as Department[]),
          apiFetch<Neighborhood[]>('/api/v1/neighborhoods').catch(() => [] as Neighborhood[]),
        ])
        if (cancelled) return
        setCorporate(corpPage?.items[0] ?? null)
        setMayor(mayorPage?.items[0] ?? null)
        setDepartments(deps.filter((item) => item.isActive))
        setNeighborhoods(hoods.filter((item) => isOfficialNeighborhood(item.name)))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const presidency = useMemo(
    () => departments.filter((item) => departmentCategory(item) === 'Başkanlık'),
    [departments],
  )

  const directorates = useMemo(
    () =>
      departments.filter(
        (item) =>
          departmentCategory(item) !== 'Başkanlık' &&
          item.name.toLocaleLowerCase('tr-TR').includes('müdür'),
      ),
    [departments],
  )

  const serviceUnits = useMemo(
    () =>
      departments.filter(
        (item) =>
          departmentCategory(item) !== 'Başkanlık' &&
          !item.name.toLocaleLowerCase('tr-TR').includes('müdür'),
      ),
    [departments],
  )

  const whoBody =
    corporate?.body && corporate.body.trim().length > 160 ? corporate.body.trim() : WHO_WE_ARE
  const mayorBody = mayor?.body?.trim() || MAYOR_FALLBACK

  const hoodCount = useCountUp(neighborhoods.length, stats.visible)
  const deptCount = useCountUp(departments.length, stats.visible)
  const digitalCount = useCountUp(DIGITAL_SERVICE_COUNT, stats.visible)

  const orgPanel = (() => {
    if (layer === 'baskanlik') {
      return {
        kicker: '01',
        title: 'Başkanlık',
        body: 'Makam yazışması, temsil ve özel kalem bu katmanda toplanır. Kişi isimleri üretilmez; dizin kaydı birim düzeyindedir.',
        items: presidency,
        to: '/baskan',
        action: 'Başkanlık mesajını oku',
      }
    }
    if (layer === 'yardimci') {
      return {
        kicker: '02',
        title: 'Başkan yardımcıları',
        body: 'Yardımcı makamlar, başkanlık ofisine bağlı koordinasyon katmanıdır. Bu demoda gerçek veya uydurma kişi kartı yayınlanmaz.',
        items: presidency,
        to: '/birimler',
        action: 'Başkanlık birimlerini gör',
      }
    }
    if (layer === 'mudurluk') {
      return {
        kicker: '03',
        title: 'Müdürlükler',
        body: 'Hizmet üretimi müdürlükler üzerinden yürür. Aşağıdaki adlar dizinden gelir; tam rehber Birimler sayfasındadır.',
        items: directorates.slice(0, 8),
        to: '/birimler',
        action: 'Tüm müdürlükleri aç',
      }
    }
    return {
      kicker: '04',
      title: 'Hizmet birimleri',
      body: 'Vatandaşın günlük işlemi masa, ulaşım ve sosyal destek birimlerinde karşılanır. Rehber, işlem kısa yollarını ayrı tutar.',
      items: serviceUnits,
      to: '/hizmet-rehberi',
      action: 'Hizmet rehberine git',
    }
  })()

  return (
    <div className="ins">
      <header className="ins-hero">
        <div className="ins-hero-copy">
          <p className="ins-kicker">Kurumsal</p>
          <p className="ins-brand">Arnavutköy Belediyesi</p>
          <h1>
            Şehrin bugününü yönetiyor,
            <em> yarınını birlikte tasarlıyoruz.</em>
          </h1>
          <p className="ins-lead">
            Belediyenin kimliğini, yönetim anlayışını ve organizasyon yapısını tanımak için bu sayfa
            hazırlandı. Metinler portföy demosudur.
          </p>
        </div>
        <figure className="ins-hero-photo">
          <img src={COVERS.institution.src} alt={COVERS.institution.alt} />
          <figcaption>Kent ve kıyı hattı · tanıtım görseli</figcaption>
        </figure>
      </header>

      <Reveal>
        <section className="ins-who" aria-labelledby="ins-who-title">
          <div className="ins-who-label">
            <p className="ins-kicker">Biz kimiz?</p>
            <h2 id="ins-who-title">İlçenin kamu yüzü, vatandaşın hizmet kapısı.</h2>
          </div>
          <div className="ins-who-copy">
            {whoBody.split('\n').filter(Boolean).map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          </div>
        </section>
      </Reveal>

      <div ref={stats.ref} className={`ins-stats${stats.visible ? ' is-in' : ''}`} aria-label="Kurumsal göstergeler">
        <Link to="/muhtarliklar">
          <strong>{loading ? '—' : hoodCount}</strong>
          <span>Mahalle / muhtarlık</span>
        </Link>
        <Link to="/birimler">
          <strong>{loading ? '—' : deptCount}</strong>
          <span>Hizmet birimi</span>
        </Link>
        <Link to="/e-belediye">
          <strong>{loading ? '—' : digitalCount}</strong>
          <span>Dijital hizmet grubu</span>
        </Link>
      </div>

      <Reveal>
        <section className="ins-mission" aria-labelledby="ins-mission-title">
          <p className="ins-kicker">Misyon</p>
          <h2 id="ins-mission-title">
            Vatandaşa güvenilir, hızlı ve anlaşılır kamu hizmeti sunmak; kurumsal süreçleri tek portalda görünür kılmak.
          </h2>
        </section>
      </Reveal>

      <Reveal>
        <section className="ins-vision" aria-labelledby="ins-vision-title">
          <figure>
            <img src={COVERS.park.src} alt={COVERS.park.alt} />
          </figure>
          <div>
            <p className="ins-kicker">Vizyon</p>
            <h2 id="ins-vision-title">Yaşanabilir, yeşil ve dijital bir ilçe.</h2>
            <p>
              Kent gelişimi park, ulaşım ve e-hizmetle birlikte düşünülür. Bu cümle örnek bir yön
              tarifidir; resmi strateji belgesi değildir.
            </p>
            <Link to="/faaliyetler">Faaliyet defterine bak →</Link>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="ins-values" aria-labelledby="ins-values-title">
          <header>
            <p className="ins-kicker">Değerler</p>
            <h2 id="ins-values-title">Karar alırken tutulan dört çizgi.</h2>
          </header>
          <ol>
            {VALUES.map((item) => (
              <li key={item.n}>
                <span>{item.n}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="ins-approach" id="yonelim" aria-labelledby="ins-approach-title">
          <div>
            <p className="ins-kicker">Yönetim yaklaşımı</p>
            <h2 id="ins-approach-title">Merkezî karar, mahalle ölçeğinde hizmet.</h2>
          </div>
          <div className="ins-approach-cols">
            <p>
              Başkanlık yönü belirler; müdürlükler üretir; hizmet masası vatandaşı karşılar. Bu katmanlar
              birbirinin kopyası değildir — her biri ayrı bir sorumluluk taşır.
            </p>
            <p>
              Dijital kanal, gişenin yerine geçmez; beklemeyi kısaltır. Stratejik plan ve yönetmelik arşivi
              bu demoda ayrı sayfa olarak yayınlanmaz; yön özeti bu bölümde tutulur.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="ins-story" aria-labelledby="ins-story-title">
          <header>
            <p className="ins-kicker">Arnavutköy’ün hikâyesi</p>
            <h2 id="ins-story-title">Geçmişten yarına örnek bir hat.</h2>
            <p>Yıllar ve dönüm noktaları kurgusal anlatıdır; kesin tarih iddiası taşımaz.</p>
          </header>
          <ol>
            {STORY.map((step, index) => (
              <li key={step.era} style={{ '--ins-i': index } as CSSProperties}>
                <em>{step.era}</em>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="ins-org" aria-labelledby="ins-org-title">
          <header>
            <p className="ins-kicker">Organizasyon</p>
            <h2 id="ins-org-title">Kurum nasıl örgütlenir?</h2>
            <p>Katmanı seçin; dizin sayfasını burada tekrarlamıyoruz.</p>
          </header>
          <div className="ins-org-grid">
            <div className="ins-org-spine" role="tablist" aria-label="Organizasyon katmanları">
              {(
                [
                  ['baskanlik', 'Başkanlık'],
                  ['yardimci', 'Başkan yardımcıları'],
                  ['mudurluk', 'Müdürlükler'],
                  ['hizmet', 'Hizmet birimleri'],
                ] as const
              ).map(([id, label], index) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-label={label}
                  aria-selected={layer === id}
                  className={layer === id ? 'is-on' : undefined}
                  onClick={() => setLayer(id)}
                >
                  <span aria-hidden>0{index + 1}</span>
                  {label}
                </button>
              ))}
            </div>
            <article className="ins-org-panel" role="tabpanel">
              <p className="ins-kicker">{orgPanel.kicker}</p>
              <h3>{orgPanel.title}</h3>
              <p>{orgPanel.body}</p>
              {orgPanel.items.length > 0 ? (
                <ul>
                  {orgPanel.items.map((item) => (
                    <li key={item.id}>
                      <Link to={`/birimler/${item.id}`}>{item.name}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ins-empty">
                  {loading ? 'Birimler yükleniyor…' : 'Bu katmanda dizin kaydı yok.'}
                </p>
              )}
              <Link className="ins-org-go" to={orgPanel.to}>
                {orgPanel.action} →
              </Link>
            </article>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="ins-mayor" aria-labelledby="ins-mayor-title">
          <figure>
            <img src={COVERS.mayor.src} alt={COVERS.mayor.alt} />
          </figure>
          <div>
            <p className="ins-kicker">Başkanlık</p>
            <h2 id="ins-mayor-title">{mayor?.title ?? 'Kurumsal mesaj'}</h2>
            <blockquote>{mayorBody}</blockquote>
            <div className="ins-mayor-links">
              <Link to="/baskan">Başkanlık sayfası</Link>
              <Link to="/iletisim">Yazışma</Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <nav className="ins-discover" aria-labelledby="ins-discover-title">
          <header>
            <p className="ins-kicker">Kurumu keşfet</p>
            <h2 id="ins-discover-title">Belediyenin kapıları.</h2>
          </header>
          <ol>
            {DISCOVER.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>
                  <span>{item.n}</span>
                  <strong>{item.title}</strong>
                  <em>{item.hint}</em>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </Reveal>
    </div>
  )
}
