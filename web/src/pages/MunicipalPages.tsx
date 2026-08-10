import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
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
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor={`q-${kind}`}>Ara</label>
        <input id={`q-${kind}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Başlık veya özet" />
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="panel-link-grid">
        {filtered.map((item) => (
          <Link key={item.id} to={`${basePath}/${item.id}`} className="panel panel-link">
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {item.category ?? kind}
              {item.startsAtUtc ? ` · ${new Date(item.startsAtUtc).toLocaleDateString('tr-TR')}` : ''}
            </span>
            <strong>{item.title}</strong>
            <span className="muted">{item.summary}</span>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && !error ? <p className="muted">Kayıt yok.</p> : null}
    </div>
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
    <div className="container stack page">
      <p className="muted" style={{ margin: 0 }}>{fallbackTitle} · {item.category}</p>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{item.title}</h1>
      {item.location ? <p className="muted">Konum: {item.location}</p> : null}
      {item.startsAtUtc ? (
        <p className="muted">
          {new Date(item.startsAtUtc).toLocaleString('tr-TR')}
          {item.endsAtUtc ? ` — ${new Date(item.endsAtUtc).toLocaleString('tr-TR')}` : ''}
        </p>
      ) : null}
      <article className="panel" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{item.body}</article>
    </div>
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

export function MayorPage() {
  const [item, setItem] = useState<PortalContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Mayor&pageSize=1')
        setItem(page.items[0] ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Yüklenemedi.')
      }
    })()
  }, [])
  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Başkan</h1>
      <p className="muted">Kurumsal mesaj — portföy demosudur, resmi makam değildir.</p>
      {error ? <div className="error-box">{error}</div> : null}
      {item ? (
        <article className="panel stack">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>{item.title}</h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{item.body}</p>
        </article>
      ) : !error ? (
        <p className="muted">Yükleniyor…</p>
      ) : null}
    </div>
  )
}

export function CorporatePage() {
  const [item, setItem] = useState<PortalContent | null>(null)
  useEffect(() => {
    void (async () => {
      const page = await apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Corporate&pageSize=1')
      setItem(page.items[0] ?? null)
    })().catch(() => undefined)
  }, [])
  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Kurumsal</h1>
      <p className="muted">Organizasyon özeti — kurgusal demo.</p>
      {item ? (
        <article className="panel" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h2>
          {item.body}
        </article>
      ) : (
        <p className="muted">Yükleniyor…</p>
      )}
      <div className="panel-link-grid">
        <Link className="panel panel-link" to="/birimler"><strong>Birimler</strong><span className="muted">Departman dizini</span></Link>
        <Link className="panel panel-link" to="/muhtarliklar"><strong>Muhtarlıklar</strong><span className="muted">Mahalle iletişimi</span></Link>
        <Link className="panel panel-link" to="/iletisim"><strong>Bize ulaşın</strong><span className="muted">İletişim formu</span></Link>
      </div>
    </div>
  )
}

export function EBelediyeHubPage() {
  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>E-Belediye</h1>
      <p className="muted">Vergi, başvuru, nikah, imar ve spor işlemleri tek çatıda.</p>
      <div className="panel-link-grid">
        <Link className="panel panel-link" to="/vezne"><strong>Vergi ödeme</strong><span className="muted">Dijital vezne</span></Link>
        <Link className="panel panel-link" to="/basvuru-takip"><strong>Başvuru & belge takibi</strong><span className="muted">Takip kodu ile sorgula</span></Link>
        <Link className="panel panel-link" to="/basvurular"><strong>Yeni belge başvurusu</strong><span className="muted">İkametgâh, borç yoktur…</span></Link>
        <Link className="panel panel-link" to="/nikah"><strong>Nikah işlemleri</strong><span className="muted">Salon / saat seç</span></Link>
        <Link className="panel panel-link" to="/imar"><strong>İmar durumu & harç</strong><span className="muted">Ada / parsel sorgu</span></Link>
        <Link className="panel panel-link" to="/spor-randevu"><strong>Spor randevu</strong><span className="muted">Tesis saatleri</span></Link>
        <Link className="panel panel-link" to="/borclar"><strong>Borçlarım</strong><span className="muted">Su / emlak</span></Link>
        <Link className="panel panel-link" to="/hizmet-rehberi"><strong>Hizmet rehberi</strong><span className="muted">Kısa yol kartları</span></Link>
      </div>
    </div>
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
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Bize ulaşın</h1>
      <p className="muted">Demo çağrı merkezi: 0212 600 00 00 · resmi kurum değildir.</p>
      {msg ? <div className="success-box">{msg}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
        <div className="field"><label>Ad soyad</label><input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="field"><label>E-posta</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Telefon</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90…" /></div>
        <div className="field"><label>Konu</label><input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="field"><label>Mesaj</label><textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <button type="submit" className="btn btn-primary">Gönder</button>
      </form>
    </div>
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
      setResult(await apiFetch<TrackingLookup>(`/api/v1/e-services/tracking/${encodeURIComponent(code.trim())}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorgulama başarısız.')
    }
  }

  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Başvuru & belge takibi</h1>
      <p className="muted">BV- / SP- / NK- takip kodlarıyla durum sorgulayın.</p>
      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
        <div className="field"><label>Takip kodu</label><input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Örn. BV-260811-1234" /></div>
        <button className="btn btn-primary" type="submit">Sorgula</button>
      </form>
      {error ? <div className="error-box">{error}</div> : null}
      {result ? (
        <article className="panel stack">
          <strong>{result.title}</strong>
          <span>Tür: {result.kind}</span>
          <span>Kod: {result.trackingCode}</span>
          <span>Durum: {result.status}</span>
          {result.whenUtc ? <span>Zaman: {new Date(result.whenUtc).toLocaleString('tr-TR')}</span> : null}
          {result.detail ? <span className="muted">{result.detail}</span> : null}
        </article>
      ) : null}
      <p className="muted"><Link to="/basvurular">Yeni belge başvurusu oluştur →</Link></p>
    </div>
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
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Belge başvuruları</h1>
      <p className="muted">İkametgâh, borç yoktur, imar belgesi vb. (demo).</p>
      {!isAuthenticated ? <div className="error-box">Devam için <Link to="/giris">giriş yapın</Link>.</div> : null}
      {info ? <div className="success-box">{info}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
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
        <div className="field"><label>Başlık</label><input required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="field"><label>Açıklama</label><textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>Başvur</button>
      </form>
      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="panel stack">
            <strong>{item.title}</strong>
            <span className="muted">{item.type} · {item.status} · {item.trackingCode}</span>
            <span>{item.description}</span>
          </article>
        ))}
      </div>
    </div>
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
      const created = await apiFetch<MarriageBooking>('/api/v1/e-services/marriage/book', {
        method: 'POST',
        body: JSON.stringify({ slotId, partnerFullName: partner }),
      }, true)
      setBooking(created)
      const list = await apiFetch<MarriageSlot[]>('/api/v1/e-services/marriage/slots')
      setSlots(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezervasyon başarısız.')
    }
  }

  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Nikah işlemleri</h1>
      <p className="muted">Salon ve saat seçerek demo rezervasyon oluşturun.</p>
      {!isAuthenticated ? <div className="error-box"><Link to="/giris">Giriş</Link> gerekli.</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      {booking ? <div className="success-box">Rezerve edildi · {booking.trackingCode} · {booking.hallName}</div> : null}
      <div className="panel stack">
        {slots.map((s) => (
          <div key={s.id} className="row-between">
            <div>
              <strong>{s.hallName}</strong>
              <div className="muted">{new Date(s.ceremonyAtUtc).toLocaleString('tr-TR')}</div>
            </div>
            <span className="muted">{s.remaining}/{s.capacity} · {s.isOpen ? 'Açık' : 'Dolu'}</span>
          </div>
        ))}
      </div>
      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
        <div className="field">
          <label>Saat</label>
          <select value={slotId} onChange={(e) => setSlotId(e.target.value)}>
            {slots.filter((s) => s.isOpen).map((s) => (
              <option key={s.id} value={s.id}>{s.hallName} — {new Date(s.ceremonyAtUtc).toLocaleString('tr-TR')}</option>
            ))}
          </select>
        </div>
        <div className="field"><label>Eş ad soyad</label><input required value={partner} onChange={(e) => setPartner(e.target.value)} /></div>
        <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>Rezerve et</button>
      </form>
    </div>
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
      setParcel(await apiFetch<ZoningParcel>(`/api/v1/e-services/zoning?ada=${encodeURIComponent(ada)}&parsel=${encodeURIComponent(parsel)}`))
    } catch (err) {
      setParcel(null)
      setError(err instanceof Error ? err.message : 'Sorgulama başarısız.')
    }
  }

  async function calc(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      setQuote(await apiFetch<ZoningFeeQuote>('/api/v1/e-services/zoning/fee', {
        method: 'POST',
        body: JSON.stringify({ ada, parsel, requestedAreaSqm: Number(area) }),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesaplanamadı.')
    }
  }

  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>İmar durumu & harç</h1>
      <p className="muted">Demo parseller: 45/8, 12/3, 7/21 — gerçek tapu verisi değildir.</p>
      {error ? <div className="error-box">{error}</div> : null}
      <form className="panel stack" onSubmit={(e) => void lookup(e)}>
        <div className="field"><label>Ada</label><input required value={ada} onChange={(e) => setAda(e.target.value)} /></div>
        <div className="field"><label>Parsel</label><input required value={parsel} onChange={(e) => setParsel(e.target.value)} /></div>
        <button className="btn btn-primary" type="submit">İmar durumu sorgula</button>
      </form>
      {parcel ? (
        <article className="panel stack">
          <strong>{parcel.neighborhoodName} — Ada {parcel.ada} / Parsel {parcel.parsel}</strong>
          <span>Durum: {parcel.zoningStatus}</span>
          <span>Kullanım: {parcel.landUse}</span>
          <span>Alan: {parcel.areaSqm} m² · Harç birim: {money(parcel.feePerSqm)}/m²</span>
        </article>
      ) : null}
      <form className="panel stack" onSubmit={(e) => void calc(e)}>
        <div className="field"><label>Hesaplanacak alan (m²)</label><input required type="number" min={1} step="0.01" value={area} onChange={(e) => setArea(e.target.value)} /></div>
        <button className="btn btn-secondary" type="submit">Harç hesapla</button>
      </form>
      {quote ? (
        <article className="panel stack">
          <strong>Toplam harç: {money(quote.totalFee)}</strong>
          <span className="muted">{quote.requestedAreaSqm} m² × {money(quote.feePerSqm)}</span>
        </article>
      ) : null}
    </div>
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
      const booked = await apiFetch<SportsAppointment>('/api/v1/e-services/sports/book', {
        method: 'POST',
        body: JSON.stringify({ facilityId, slotStartUtc }),
      }, true)
      setInfo(`Randevu alındı · ${booked.trackingCode}`)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Randevu başarısız.')
    }
  }

  return (
    <div className="container stack page">
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Spor randevu</h1>
      <p className="muted">Halı saha, salon ve havuz için saatlik rezervasyon.</p>
      {!isAuthenticated ? <div className="error-box"><Link to="/giris">Giriş</Link> gerekli.</div> : null}
      {info ? <div className="success-box">{info}</div> : null}
      {error ? <div className="error-box">{error}</div> : null}
      <div className="panel-link-grid">
        {facilities.map((f) => (
          <article key={f.id} className="panel stack">
            <strong>{f.name}</strong>
            <span className="muted">{f.activityType} · {f.address}</span>
            <span>Kapasite / saat: {f.capacityPerSlot}</span>
          </article>
        ))}
      </div>
      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
        <div className="field">
          <label>Tesis</label>
          <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Başlangıç</label>
          <input required type="datetime-local" value={slotLocal} onChange={(e) => setSlotLocal(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={!isAuthenticated}>Randevu al</button>
      </form>
      <section className="stack">
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Randevularım</h2>
        {mine.map((m) => (
          <article key={m.id} className="panel stack">
            <strong>{m.facilityName}</strong>
            <span>{new Date(m.slotStartUtc).toLocaleString('tr-TR')} · {m.status}</span>
            <span className="muted">{m.trackingCode}</span>
          </article>
        ))}
      </section>
    </div>
  )
}
