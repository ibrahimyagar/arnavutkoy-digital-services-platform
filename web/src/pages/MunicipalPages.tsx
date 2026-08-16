import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PublicPage, PublicRelated, PublicSection } from '../components/ui/PublicPage'
import {
  apiFetch,
  type DocumentApplication,
  type MarriageBooking,
  type MarriageSlot,
  type SportsAppointment,
  type SportsFacility,
  type TrackingLookup,
  type ZoningFeeQuote,
  type ZoningParcel,
} from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'

function money(n: number) {
  return n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export { CorporatePage } from './CorporatePage'
export { MayorPage } from './MayorPage'
export { ContactPage } from './ContactPage'

export function TrackingPage() {
  const [params] = useSearchParams()
  const initial = params.get('kod')?.trim() ?? ''
  const [code, setCode] = useState(initial)
  const [result, setResult] = useState<TrackingLookup | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function lookup(value: string) {
    setError(null)
    setResult(null)
    setResult(
      await apiFetch<TrackingLookup>(`/api/v1/e-services/tracking/${encodeURIComponent(value)}`),
    )
  }

  useEffect(() => {
    if (!initial) return
    void lookup(initial).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Sorgulama başarısız.')
    })
  }, [initial])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await lookup(code.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sorgulama başarısız.')
    }
  }

  return (
    <PublicPage
      eyebrow="E-Belediye"
      title="Başvuru & belge takibi"
      lead="BV- / SP- / NK- / ILET- takip kodlarıyla durum sorgulayın."
      cover={COVERS.eBelediye}
    >
      <PublicSection title="Sorgula">
        <form className="pub-form" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="track-code">Takip kodu</label>
            <input
              id="track-code"
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
