import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { EmptyState } from '../components/ui/PageChrome'
import { PublicPage, PublicRelated, PublicSection } from '../components/ui/PublicPage'
import {
  apiFetch,
  type DocumentApplication,
  type MarriageBooking,
  type MarriageSlot,
  type Paginated,
  type PortalContent,
  type SportsAppointment,
  type SportsFacility,
  type TrackingLookup,
  type ZoningFeeQuote,
  type ZoningParcel,
} from '../lib/api'
import { COVERS, coverForPortalKind, RELATED } from '../lib/contentVisuals'

function money(n: number) {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function PortalListPage({
  kind,
  title,
  subtitle,
  basePath,
}: {
  kind: string
  title: string
  subtitle: string
  basePath: string
}) {
  const [items, setItems] = useState<PortalContent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>(
          `/api/v1/portal?kind=${encodeURIComponent(kind)}&pageSize=50`,
        )
        setItems(page.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'İçerik yüklenemedi.')
      }
    })()
  }, [kind])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return items
    return items.filter(
      (item) =>
        item.title.toLocaleLowerCase('tr-TR').includes(needle) ||
        item.summary.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [items, q])

  return (
    <PublicPage title={title} lead={subtitle} cover={coverForPortalKind(kind)}>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor={`q-${kind}`}>Ara</label>
        <input
          id={`q-${kind}`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Başlık veya özet"
        />
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="pub-hub-grid">
        {filtered.map((item) => (
          <Link key={item.id} to={`${basePath}/${item.id}`}>
            <strong>{item.title}</strong>
            <span>
              {item.category ?? kind}
              {item.startsAtUtc
                ? ` · ${new Date(item.startsAtUtc).toLocaleDateString('tr-TR')}`
                : ''}
              {item.summary ? ` — ${item.summary}` : ''}
            </span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && !error ? (
        <EmptyState title="Kayıt yok" description="Bu kategoride içerik bulunamadı." />
      ) : null}
      <PublicRelated items={RELATED.media} />
    </PublicPage>
  )
}

function PortalDetailPage({ fallbackTitle }: { fallbackTitle: string }) {
  const { id } = useParams()
  const [item, setItem] = useState<PortalContent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        setItem(await apiFetch<PortalContent>(`/api/v1/portal/${id}`))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Detay yüklenemedi.')
      }
    })()
  }, [id])

  if (error) return <div className="container page"><div className="error-box">{error}</div></div>
  if (!item) return <div className="container page"><p className="muted">Yükleniyor…</p></div>

  return (
    <PublicPage
      eyebrow={fallbackTitle}
      title={item.title}
      lead={item.summary || undefined}
      cover={coverForPortalKind(item.kind)}
    >
      <p className="muted" style={{ margin: 0 }}>
        {item.category}
        {item.location ? ` · ${item.location}` : ''}
      </p>
      {item.startsAtUtc ? (
        <p className="muted" style={{ margin: 0 }}>
          {new Date(item.startsAtUtc).toLocaleString('tr-TR')}
          {item.endsAtUtc ? ` — ${new Date(item.endsAtUtc).toLocaleString('tr-TR')}` : ''}
        </p>
      ) : null}
      <PublicSection tone="soft">
        <div className="pub-prose">{item.body}</div>
      </PublicSection>
      <PublicRelated items={RELATED.media} />
    </PublicPage>
  )
}

export function NewsPage() {
  return (
    <PortalListPage
      kind="News"
      title="Haberler"
      subtitle="Güncel belediye haberleri — kurgusal demo içerik."
      basePath="/haberler"
    />
  )
}
export function NewsDetailPage() {
  return <PortalDetailPage fallbackTitle="Haber" />
}

export function EventsPage() {
  return (
    <PortalListPage
      kind="Event"
      title="Etkinlikler"
      subtitle="Kültür, spor ve açık hava etkinlik takvimi."
      basePath="/etkinlikler"
    />
  )
}
export function EventsDetailPage() {
  return <PortalDetailPage fallbackTitle="Etkinlik" />
}

export function ProjectsPage() {
  return (
    <PortalListPage
      kind="Project"
      title="Faaliyetler"
      subtitle="Park, yol ve sosyal proje özetleri."
      basePath="/faaliyetler"
    />
  )
}
export function ProjectsDetailPage() {
  return <PortalDetailPage fallbackTitle="Faaliyet" />
}

export function CulturePage() {
  return (
    <PortalListPage
      kind="CultureVenue"
      title="Kültür & sanat"
      subtitle="Kültürel tesisler ve mekânlar."
      basePath="/kultur"
    />
  )
}
export function CultureDetailPage() {
  return <PortalDetailPage fallbackTitle="Kültür" />
}

export function ServiceGuidePage() {
  return (
    <PortalListPage
      kind="ServiceGuide"
      title="Hizmet rehberi"
      subtitle="Sık kullanılan e-belediye işlemlerine kısa yol."
      basePath="/hizmet-rehberi"
    />
  )
}
export function ServiceGuideDetailPage() {
  return <PortalDetailPage fallbackTitle="Hizmet" />
}

const CORPORATE_FALLBACK = `Bu sayfa, portföy demosunda belediye organizasyonunun nasıl anlatılacağını gösterir. Gerçek Arnavutköy Belediyesi resmi içeriği değildir.

Vatandaşın kurumsal yapıya, hizmet birimlerine ve mahalle iletişimine tek bakışta ulaşması hedeflenir. Aşağıdaki metinler kurgusal özetlerdir; üretim ortamında CMS veya portal API’sinden beslenir.`

export function MayorPage() {
  const [item, setItem] = useState<PortalContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Mayor&pageSize=1')
        setItem(page.items[0] ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Yüklenemedi.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  return (
    <PublicPage
      eyebrow="Kurumsal"
      title="Başkan"
      lead="Kurumsal mesaj alanı — portföy demosudur, resmi makam değildir."
      cover={COVERS.mayor}
    >
      {error ? <div className="error-box">{error}</div> : null}
      <PublicSection title={item?.title ?? 'Başkanın mesajı'} tone="soft">
        {loading && !item ? (
          <p className="muted">Yükleniyor…</p>
        ) : (
          <div className="pub-prose">
            {item?.body ??
              'Demo mesaj: İlçemizde hizmetlerin dijitalleşmesi, şeffaf iletişim ve mahalle ölçeğinde erişilebilirlik önceliğimizdir. Bu metin yalnızca arayüz örneğidir.'}
          </div>
        )}
      </PublicSection>
      <div className="pub-split">
        <article>
          <h3>Öncelikler</h3>
          <p>
            Dijital başvuru, ulaşım bilgisi ve duyuru kanallarının tek portalda toplanması; vatandaşın
            bekleme süresini kısaltmak.
          </p>
        </article>
        <article>
          <h3>İletişim</h3>
          <p>
            Talep ve öneriler için iletişim formu veya demo çağrı hattı kullanılabilir. Yanıt süreleri
            örnek veridir.
          </p>
        </article>
      </div>
      <PublicRelated items={RELATED.municipal} />
    </PublicPage>
  )
}

export function CorporatePage() {
  const [item, setItem] = useState<PortalContent | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Corporate&pageSize=1')
        setItem(page.items[0] ?? null)
      } catch {
        /* fallback metin kullanılır */
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <PublicPage
      eyebrow="Belediye"
      title="Kurumsal"
      lead="Organizasyon özeti, hizmet birimleri ve mahalle iletişimi — kurgusal demo içerik."
      cover={COVERS.guide}
    >
      <div className="pub-facts" aria-label="Özet göstergeler">
        <div>
          <strong>38+</strong>
          <span>Mahalle / muhtarlık erişimi (demo)</span>
        </div>
        <div>
          <strong>12</strong>
          <span>Örnek hizmet birimi</span>
        </div>
        <div>
          <strong>7/24</strong>
          <span>Dijital başvuru ve takip (demo)</span>
        </div>
      </div>

      <PublicSection title={item?.title ?? 'Kurumsal yapı'} tone="soft">
        {loading && !item ? (
          <p className="muted">Yükleniyor…</p>
        ) : (
          <div className="pub-prose">{item?.body ?? CORPORATE_FALLBACK}</div>
        )}
      </PublicSection>

      <PublicSection title="Misyon ve yaklaşım">
        <div className="pub-split">
          <article>
            <h3>Misyon</h3>
            <p>
              Vatandaşa güvenilir, hızlı ve anlaşılır dijital hizmet sunmak; kurumsal süreçleri tek
              portalda görünür kılmak.
            </p>
          </article>
          <article>
            <h3>Yaklaşım</h3>
            <p>
              Şeffaf duyuru, mahalle ölçeğinde iletişim ve e-belediye işlemlerinin aynı deneyimde
              birleşmesi. İçerikler örnek amaçlıdır.
            </p>
          </article>
        </div>
      </PublicSection>

      <PublicSection title="Organizasyon">
        <nav className="pub-org" aria-label="Organizasyon bağlantıları">
          <Link to="/baskan">
            <strong>Başkan</strong>
            <span>Kurumsal mesaj ve öncelikler</span>
            <em>İncele →</em>
          </Link>
          <Link to="/birimler">
            <strong>Birimler</strong>
            <span>Departman ve personel dizini</span>
            <em>İncele →</em>
          </Link>
          <Link to="/muhtarliklar">
            <strong>Muhtarlıklar</strong>
            <span>Mahalle nüfus ve iletişim özeti</span>
            <em>İncele →</em>
          </Link>
          <Link to="/hizmet-rehberi">
            <strong>Hizmet rehberi</strong>
            <span>Sık kullanılan işlemlere kısa yol</span>
            <em>İncele →</em>
          </Link>
        </nav>
      </PublicSection>

      <PublicRelated title="Sık kullanılanlar" items={RELATED.eServices} />
    </PublicPage>
  )
}

export function EBelediyeHubPage() {
  return (
    <PublicPage
      eyebrow="Dijital hizmetler"
      title="E-Belediye"
      lead="Vergi, başvuru, nikah, imar ve spor işlemleri tek çatıda — demo ortamı."
      cover={COVERS.eBelediye}
    >
      <div className="pub-facts" aria-label="Hizmet özeti">
        <div>
          <strong>8</strong>
          <span>Ana e-hizmet grubu</span>
        </div>
        <div>
          <strong>BV-</strong>
          <span>Takip kodu ile başvuru sorgusu</span>
        </div>
        <div>
          <strong>Demo</strong>
          <span>Gerçek ödeme / resmi işlem yok</span>
        </div>
      </div>

      <PublicSection title="İşlemler">
        <div className="pub-hub-grid">
          <Link to="/vezne">
            <strong>Vergi ödeme</strong>
            <span>Dijital vezne</span>
          </Link>
          <Link to="/basvuru-takip">
            <strong>Başvuru & belge takibi</strong>
            <span>Takip kodu ile sorgula</span>
          </Link>
          <Link to="/basvurular">
            <strong>Yeni belge başvurusu</strong>
            <span>İkametgâh, borç yoktur…</span>
          </Link>
          <Link to="/nikah">
            <strong>Nikah işlemleri</strong>
            <span>Salon / saat seç</span>
          </Link>
          <Link to="/imar">
            <strong>İmar durumu & harç</strong>
            <span>Ada / parsel sorgu</span>
          </Link>
          <Link to="/spor-randevu">
            <strong>Spor randevu</strong>
            <span>Tesis saatleri</span>
          </Link>
          <Link to="/borclar">
            <strong>Borçlarım</strong>
            <span>Su / emlak</span>
          </Link>
          <Link to="/hizmet-rehberi">
            <strong>Hizmet rehberi</strong>
            <span>Kısa yol kartları</span>
          </Link>
        </div>
      </PublicSection>

      <PublicRelated items={RELATED.municipal} />
    </PublicPage>
  )
}

export function ContactPage() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMsg(null)
    try {
      await apiFetch('/api/v1/e-services/contact', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone: phone || null, subject, body }),
      })
      setMsg('Mesajınız alındı. En kısa sürede dönüş yapılacak (demo).')
      setSubject('')
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gönderilemedi.')
    }
  }

  return (
    <PublicPage
      eyebrow="İletişim"
      title="Bize ulaşın"
      lead="Demo çağrı merkezi: 0212 600 00 00 · resmi kurum değildir. Mesajlar örnek API’ye yazılır."
      cover={COVERS.guide}
    >
      <div className="pub-split">
        <article>
          <h3>Nasıl yardımcı oluruz?</h3>
          <p>
            Talep, öneri ve genel sorular için formu kullanın. Başvuru durumu için takip kodunuzu
            e-belediye üzerinden sorgulayabilirsiniz.
          </p>
        </article>
        <article>
          <h3>Çalışma saatleri (demo)</h3>
          <p>
            Hafta içi 09:00–17:00. Acil durumlar için gerçek belediye kanallarını kullanın; bu site
            portföy demosudur.
          </p>
        </article>
      </div>

      {msg ? <div className="success-box">{msg}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}

      <PublicSection title="Mesaj formu">
        <form className="pub-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label>Ad soyad</label>
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="field">
            <label>E-posta</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90…" />
          </div>
          <div className="field">
            <label>Konu</label>
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="field">
            <label>Mesaj</label>
            <textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">
            Gönder
          </button>
        </form>
      </PublicSection>

      <PublicRelated items={RELATED.eServices} />
    </PublicPage>
  )
}

export function TrackingPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<TrackingLookup | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    try {
      setResult(
        await apiFetch<TrackingLookup>(
          `/api/v1/e-services/tracking/${encodeURIComponent(code.trim())}`,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorgulama başarısız.')
    }
  }

  return (
    <PublicPage
      eyebrow="E-Belediye"
      title="Başvuru & belge takibi"
      lead="BV- / SP- / NK- takip kodlarıyla durum sorgulayın."
      cover={COVERS.eBelediye}
    >
      <PublicSection title="Sorgula">
        <form className="pub-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label>Takip kodu</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Örn. BV-260811-1234"
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Sorgula
          </button>
        </form>
      </PublicSection>
      {error ? <div className="error-box">{error}</div> : null}
      {result ? (
        <PublicSection title="Sonuç" tone="soft">
          <div className="stack">
            <strong>{result.title}</strong>
            <span>Tür: {result.kind}</span>
            <span>Kod: {result.trackingCode}</span>
            <span>Durum: {result.status}</span>
            {result.whenUtc ? (
              <span>Zaman: {new Date(result.whenUtc).toLocaleString('tr-TR')}</span>
            ) : null}
            {result.detail ? <span className="muted">{result.detail}</span> : null}
          </div>
        </PublicSection>
      ) : null}
      <PublicRelated items={RELATED.eServices} />
    </PublicPage>
  )
}

export function DocumentApplicationsPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<DocumentApplication[]>([])
  const [type, setType] = useState('Ikametgah')
  const [title, setTitle] = useState('İkametgâh belgesi talebi')
  const [description, setDescription] = useState('Demo başvuru — Hadımköy mahallesi.')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function load() {
    if (!isAuthenticated) return
    setItems(await apiFetch<DocumentApplication[]>('/api/v1/e-services/documents/mine', {}, true))
  }

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : 'Yüklenemedi.'))
  }, [isAuthenticated])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isAuthenticated) {
      setError('Başvuru için giriş yapın.')
      return
    }
    setError(null)
    try {
      const created = await apiFetch<DocumentApplication>('/api/v1/e-services/documents', {
        method: 'POST',
        body: JSON.stringify({ type, title, description }),
      }, true)
      setInfo(`Başvuru alındı. Takip kodu: ${created.trackingCode}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Başvuru başarısız.')
    }
  }

  return (
    <PublicPage
      eyebrow="E-Belediye"
      title="Belge başvuruları"
      lead="İkametgâh, borç yoktur, imar belgesi vb. (demo)."
      cover={COVERS.eBelediye}
    >
      {!isAuthenticated ? (
        <div className="error-box">
          Devam için <Link to="/giris">giriş yapın</Link>.
        </div>
      ) : null}
      {info ? <div className="success-box">{info}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      <PublicSection title="Yeni başvuru">
        <form className="pub-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label>Tür</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Ikametgah">İkametgâh</option>
              <option value="VergiBorcuYoktur">Vergi borcu yoktur</option>
              <option value="ImarDurumuBelgesi">İmar durumu belgesi</option>
              <option value="CevreTemizlik">Çevre temizlik</option>
              <option value="IsyeriRuhsat">İşyeri ruhsat</option>
              <option value="Diger">Diğer</option>
            </select>
          </div>
          <div className="field">
            <label>Başlık</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Açıklama</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>
            Başvur
          </button>
        </form>
      </PublicSection>
      {items.length > 0 ? (
        <PublicSection title="Başvurularım">
          <div className="pub-hub-grid">
            {items.map((item) => (
              <article key={item.id}>
                <strong>{item.title}</strong>
                <span>
                  {item.type} · {item.status} · {item.trackingCode}
                </span>
              </article>
            ))}
          </div>
        </PublicSection>
      ) : null}
      <PublicRelated items={RELATED.eServices} />
    </PublicPage>
  )
}

export function MarriagePage() {
  const { isAuthenticated } = useAuth()
  const [slots, setSlots] = useState<MarriageSlot[]>([])
  const [slotId, setSlotId] = useState('')
  const [partner, setPartner] = useState('')
  const [booking, setBooking] = useState<MarriageBooking | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const list = await apiFetch<MarriageSlot[]>('/api/v1/e-services/marriage/slots')
      setSlots(list)
      if (list[0]) setSlotId(list[0].id)
    })().catch((err) => setError(err instanceof Error ? err.message : 'Yüklenemedi.'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const created = await apiFetch<MarriageBooking>(
        '/api/v1/e-services/marriage/book',
        {
          method: 'POST',
          body: JSON.stringify({ slotId, partnerFullName: partner }),
        },
        true,
      )
      setBooking(created)
      const list = await apiFetch<MarriageSlot[]>('/api/v1/e-services/marriage/slots')
      setSlots(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervasyon başarısız.')
    }
  }

  return (
    <PublicPage
      eyebrow="E-Belediye"
      title="Nikah işlemleri"
      lead="Salon ve saat seçerek demo rezervasyon oluşturun."
      cover={COVERS.culture}
    >
      {!isAuthenticated ? (
        <div className="error-box">
          <Link to="/giris">Giriş</Link> gerekli.
        </div>
      ) : null}
      {error ? <div className="error-box">{error}</div> : null}
      {booking ? (
        <div className="success-box">
          Rezerve edildi · {booking.trackingCode} · {booking.hallName}
        </div>
      ) : null}
      <PublicSection title="Uygun saatler" tone="soft">
        <div className="stack">
          {slots.map((s) => (
            <div key={s.id} className="row-between">
              <div>
                <strong>{s.hallName}</strong>
                <div className="muted">{new Date(s.ceremonyAtUtc).toLocaleString('tr-TR')}</div>
              </div>
              <span className="muted">
                {s.remaining}/{s.capacity} · {s.isOpen ? 'Açık' : 'Dolu'}
              </span>
            </div>
          ))}
        </div>
      </PublicSection>
      <PublicSection title="Rezervasyon">
        <form className="pub-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label>Saat</label>
            <select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              {slots
                .filter((s) => s.isOpen)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.hallName} — {new Date(s.ceremonyAtUtc).toLocaleString('tr-TR')}
                  </option>
                ))}
            </select>
          </div>
          <div className="field">
            <label>Eş ad soyad</label>
            <input required value={partner} onChange={(e) => setPartner(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>
            Rezerve et
          </button>
        </form>
      </PublicSection>
      <PublicRelated items={RELATED.eServices} />
    </PublicPage>
  )
}

export function ZoningPage() {
  const [ada, setAda] = useState('45')
  const [parsel, setParsel] = useState('8')
  const [area, setArea] = useState('100')
  const [parcel, setParcel] = useState<ZoningParcel | null>(null)
  const [quote, setQuote] = useState<ZoningFeeQuote | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function lookup(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setQuote(null)
    try {
      setParcel(
        await apiFetch<ZoningParcel>(
          `/api/v1/e-services/zoning?ada=${encodeURIComponent(ada)}&parsel=${encodeURIComponent(parsel)}`,
        ),
      )
    } catch (err) {
      setParcel(null)
      setError(err instanceof Error ? err.message : 'Sorgulama başarısız.')
    }
  }

  async function calc(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      setQuote(
        await apiFetch<ZoningFeeQuote>('/api/v1/e-services/zoning/fee', {
          method: 'POST',
          body: JSON.stringify({ ada, parsel, requestedAreaSqm: Number(area) }),
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesaplanamadı.')
    }
  }

  return (
    <PublicPage
      eyebrow="E-Belediye"
      title="İmar durumu & harç"
      lead="Demo parseller: 45/8, 12/3, 7/21 — gerçek tapu verisi değildir."
      cover={COVERS.projects}
    >
      {error ? <div className="error-box">{error}</div> : null}
      <PublicSection title="Parsel sorgula">
        <form className="pub-form" onSubmit={(e) => void lookup(e)}>
          <div className="field">
            <label>Ada</label>
            <input required value={ada} onChange={(e) => setAda(e.target.value)} />
          </div>
          <div className="field">
            <label>Parsel</label>
            <input required value={parsel} onChange={(e) => setParsel(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">
            İmar durumu sorgula
          </button>
        </form>
      </PublicSection>
      {parcel ? (
        <PublicSection title="Sonuç" tone="soft">
          <div className="stack">
            <strong>
              {parcel.neighborhoodName} — Ada {parcel.ada} / Parsel {parcel.parsel}
            </strong>
            <span>Durum: {parcel.zoningStatus}</span>
            <span>Kullanım: {parcel.landUse}</span>
            <span>
              Alan: {parcel.areaSqm} m² · Harç birim: {money(parcel.feePerSqm)}/m²
            </span>
          </div>
        </PublicSection>
      ) : null}
      <PublicSection title="Harç hesapla">
        <form className="pub-form" onSubmit={(e) => void calc(e)}>
          <div className="field">
            <label>Hesaplanacak alan (m²)</label>
            <input
              required
              type="number"
              min={1}
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" type="submit">
            Harç hesapla
          </button>
        </form>
      </PublicSection>
      {quote ? (
        <PublicSection tone="soft">
          <div className="stack">
            <strong>Toplam harç: {money(quote.totalFee)}</strong>
            <span className="muted">
              {quote.requestedAreaSqm} m² × {money(quote.feePerSqm)}
            </span>
          </div>
        </PublicSection>
      ) : null}
      <PublicRelated items={RELATED.eServices} />
    </PublicPage>
  )
}

export function SportsAppointmentPage() {
  const { isAuthenticated } = useAuth()
  const [facilities, setFacilities] = useState<SportsFacility[]>([])
  const [mine, setMine] = useState<SportsAppointment[]>([])
  const [facilityId, setFacilityId] = useState('')
  const [slotLocal, setSlotLocal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function refresh() {
    const list = await apiFetch<SportsFacility[]>('/api/v1/e-services/sports/facilities')
    setFacilities(list)
    if (!facilityId && list[0]) setFacilityId(list[0].id)
    if (isAuthenticated) {
      setMine(await apiFetch<SportsAppointment[]>('/api/v1/e-services/sports/mine', {}, true))
    }
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : 'Yüklenemedi.'))
  }, [isAuthenticated])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    try {
      const slotStartUtc = new Date(slotLocal).toISOString()
      const booked = await apiFetch<SportsAppointment>(
        '/api/v1/e-services/sports/book',
        {
          method: 'POST',
          body: JSON.stringify({ facilityId, slotStartUtc }),
        },
        true,
      )
      setInfo(`Randevu alındı · ${booked.trackingCode}`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevu başarısız.')
    }
  }

  return (
    <PublicPage
      eyebrow="E-Belediye"
      title="Spor randevu"
      lead="Halı saha, salon ve havuz için saatlik rezervasyon."
      cover={COVERS.events}
    >
      {!isAuthenticated ? (
        <div className="error-box">
          <Link to="/giris">Giriş</Link> gerekli.
        </div>
      ) : null}
      {info ? <div className="success-box">{info}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      <PublicSection title="Tesisler">
        <div className="pub-hub-grid">
          {facilities.map((f) => (
            <article key={f.id}>
              <strong>{f.name}</strong>
              <span>
                {f.activityType} · {f.address} · Kapasite/saat: {f.capacityPerSlot}
              </span>
            </article>
          ))}
        </div>
      </PublicSection>
      <PublicSection title="Randevu al">
        <form className="pub-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label>Tesis</label>
            <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Başlangıç</label>
            <input
              required
              type="datetime-local"
              value={slotLocal}
              onChange={(e) => setSlotLocal(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>
            Randevu al
          </button>
        </form>
      </PublicSection>
      {mine.length > 0 ? (
        <PublicSection title="Randevularım">
          <div className="pub-hub-grid">
            {mine.map((m) => (
              <article key={m.id}>
                <strong>{m.facilityName}</strong>
                <span>
                  {new Date(m.slotStartUtc).toLocaleString('tr-TR')} · {m.status} · {m.trackingCode}
                </span>
              </article>
            ))}
          </div>
        </PublicSection>
      ) : null}
      <PublicRelated items={RELATED.eServices} />
    </PublicPage>
  )
}
