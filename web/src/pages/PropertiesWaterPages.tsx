import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  apiFetch,
  type CitizenProperty,
  type Neighborhood,
  type Paginated,
  type Street,
  type WaterSubscription,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

const propertyTypeLabels: Record<string, string> = {
  Residential: 'Konut',
  Commercial: 'Ticari',
  Land: 'Arsa',
}

function PropertiesContent() {
  const [items, setItems] = useState<CitizenProperty[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [streets, setStreets] = useState<Street[]>([])
  const [allStreets, setAllStreets] = useState<Street[]>([])
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [streetId, setStreetId] = useState('')
  const [title, setTitle] = useState('')
  const [doorNumber, setDoorNumber] = useState('')
  const [blockParcel, setBlockParcel] = useState('')
  const [type, setType] = useState('Residential')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const neighborhoodMap = useMemo(
    () => new Map(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  )
  const streetMap = useMemo(() => new Map(allStreets.map((s) => [s.id, s.name])), [allStreets])

  const load = useCallback(async () => {
    const [page, neigh, streetList] = await Promise.all([
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties/mine', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
      apiFetch<Street[]>('/api/v1/streets'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    setAllStreets(streetList)
    setNeighborhoodId((current) => current || neigh[0]?.id || '')
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Mülkler yüklenemedi.')
    })
  }, [load])

  useEffect(() => {
    if (!neighborhoodId) {
      setStreets([])
      setStreetId('')
      return
    }

    let cancelled = false
    void apiFetch<Street[]>(
      `/api/v1/streets?neighborhoodId=${encodeURIComponent(neighborhoodId)}`,
    )
      .then((list) => {
        if (cancelled) return
        setStreets(list)
        setStreetId((current) => (list.some((s) => s.id === current) ? current : ''))
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Sokaklar yüklenemedi.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [neighborhoodId])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        '/api/v1/properties',
        {
          method: 'POST',
          body: JSON.stringify({
            neighborhoodId,
            streetId: streetId || null,
            type,
            title,
            doorNumber,
            blockParcel: blockParcel || null,
          }),
        },
        true,
      )
      setTitle('')
      setDoorNumber('')
      setBlockParcel('')
      setStreetId('')
      setInfo('Mülk kaydı oluşturuldu.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Mülklerim</h1>
        <p className="muted">Mahalle ve sokak bilgisiyle mülk kayıtlarınız.</p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3>Yeni mülk</h3>
        <div className="field">
          <label htmlFor="neigh">Mahalle</label>
          <select
            id="neigh"
            value={neighborhoodId}
            onChange={(e) => setNeighborhoodId(e.target.value)}
            required
          >
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="street">Sokak</label>
          <select
            id="street"
            value={streetId}
            onChange={(e) => setStreetId(e.target.value)}
            disabled={!neighborhoodId}
          >
            <option value="">Sokak seçilmedi (isteğe bağlı)</option>
            {streets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {neighborhoodId && streets.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Bu mahallede henüz sokak kaydı yok.
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="ptype">Tür</label>
          <select id="ptype" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Residential">Konut</option>
            <option value="Commercial">Ticari</option>
            <option value="Land">Arsa</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="title">Başlık</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="door">Kapı no</label>
          <input
            id="door"
            value={doorNumber}
            onChange={(e) => setDoorNumber(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="parcel">Ada/parsel</label>
          <input
            id="parcel"
            value={blockParcel}
            onChange={(e) => setBlockParcel(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !neighborhoodId}>
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>

      <div className="stack">
        {items.map((p) => (
          <article key={p.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{p.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {propertyTypeLabels[p.type] ?? p.type}
                  {' · '}
                  {neighborhoodMap.get(p.neighborhoodId) ?? 'Mahalle'}
                  {p.streetId ? ` · ${streetMap.get(p.streetId) ?? 'Sokak'}` : ''}
                  {' · Kapı '}
                  {p.doorNumber}
                  {p.blockParcel ? ` · ${p.blockParcel}` : ''}
                </p>
              </div>
              <span className={p.isActive ? 'badge badge-ok' : 'badge'}>
                {p.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Kayıtlı mülk yok.</p> : null}
      </div>
    </div>
  )
}

function WaterContent() {
  const [items, setItems] = useState<WaterSubscription[]>([])
  const [properties, setProperties] = useState<CitizenProperty[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [propertyId, setPropertyId] = useState('')
  const [subscriptionNumber, setSubscriptionNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const neighborhoodMap = useMemo(
    () => new Map(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  )
  const propertyMap = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties])

  const propertiesInNeighborhood = useMemo(
    () => properties.filter((p) => p.neighborhoodId === neighborhoodId && p.isActive),
    [properties, neighborhoodId],
  )

  const load = useCallback(async () => {
    const [page, neigh, props] = await Promise.all([
      apiFetch<Paginated<WaterSubscription>>('/api/v1/water-subscriptions/mine', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties/mine', {}, true),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    setProperties(props.items)
    setNeighborhoodId((current) => current || neigh[0]?.id || '')
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Abonelikler yüklenemedi.')
    })
  }, [load])

  useEffect(() => {
    setPropertyId((current) =>
      propertiesInNeighborhood.some((p) => p.id === current) ? current : '',
    )
  }, [propertiesInNeighborhood])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        '/api/v1/water-subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            neighborhoodId,
            propertyId: propertyId || null,
            subscriptionNumber,
          }),
        },
        true,
      )
      setSubscriptionNumber('')
      setPropertyId('')
      setInfo('Su aboneliği açıldı.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik açılamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Su aboneliği</h1>
        <p className="muted">Abonelikleriniz; borçlar personel tarafından üretilir.</p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3>Yeni abonelik</h3>
        <div className="field">
          <label htmlFor="wneigh">Mahalle</label>
          <select
            id="wneigh"
            value={neighborhoodId}
            onChange={(e) => setNeighborhoodId(e.target.value)}
            required
          >
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="wprop">Bağlı mülk</label>
          <select
            id="wprop"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            disabled={!neighborhoodId}
          >
            <option value="">Mülk seçilmedi (isteğe bağlı)</option>
            {propertiesInNeighborhood.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · Kapı {p.doorNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="subno">Abone no</label>
          <input
            id="subno"
            value={subscriptionNumber}
            onChange={(e) => setSubscriptionNumber(e.target.value)}
            placeholder="AK-1001"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !neighborhoodId}>
          {busy ? 'Açılıyor…' : 'Abonelik aç'}
        </button>
      </form>

      <div className="stack">
        {items.map((s) => (
          <article key={s.id} className="panel">
            <h3 style={{ margin: 0 }}>{s.subscriptionNumber}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {neighborhoodMap.get(s.neighborhoodId) ?? 'Mahalle'}
              {s.propertyId ? ` · ${propertyMap.get(s.propertyId) ?? 'Mülk'}` : ''}
              {' · '}
              {new Date(s.activatedAtUtc).toLocaleDateString('tr-TR')}
              {' · '}
              {s.status}
            </p>
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Abonelik yok.</p> : null}
      </div>
    </div>
  )
}

export function PropertiesPage() {
  return (
    <RequireAuth>
      <PropertiesContent />
    </RequireAuth>
  )
}

export function WaterPage() {
  return (
    <RequireAuth>
      <WaterContent />
    </RequireAuth>
  )
}
