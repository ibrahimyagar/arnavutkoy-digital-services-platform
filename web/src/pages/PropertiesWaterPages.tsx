import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
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

const waterStatusLabels: Record<string, string> = {
  Active: 'Aktif',
  Closed: 'Kapalı',
  Suspended: 'Askıda',
}

function waterBadge(status: string) {
  if (status === 'Active') return 'badge badge-ok'
  if (status === 'Closed') return 'badge badge-danger'
  if (status === 'Suspended') return 'badge badge-warn'
  return 'badge'
}

const PRIORITY_NEIGHBORHOODS = [
  'Hadımköy',
  'Taşoluk',
  'Arnavutköy Merkez',
  'Boğazköy İstiklal',
  'Yeşilbayır',
  'Durusu',
]

function sortNeighborhoods(list: Neighborhood[]) {
  return [...list].sort((a, b) => {
    const ai = PRIORITY_NEIGHBORHOODS.indexOf(a.name)
    const bi = PRIORITY_NEIGHBORHOODS.indexOf(b.name)
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name, 'tr')
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function PropertiesContent() {
  const [items, setItems] = useState<CitizenProperty[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [streets, setStreets] = useState<Street[]>([])
  const [allStreets, setAllStreets] = useState<Street[]>([])
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [streetId, setStreetId] = useState('')
  const [neighQ, setNeighQ] = useState('')
  const [listFilter, setListFilter] = useState('')
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

  const sortedNeighborhoods = useMemo(() => sortNeighborhoods(neighborhoods), [neighborhoods])

  const formNeighborhoods = useMemo(() => {
    const needle = neighQ.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return sortedNeighborhoods
    return sortedNeighborhoods.filter((n) => n.name.toLocaleLowerCase('tr-TR').includes(needle))
  }, [sortedNeighborhoods, neighQ])

  const typeCounts = useMemo(() => {
    const counts = { all: items.length, Residential: 0, Commercial: 0, Land: 0, active: 0 }
    for (const item of items) {
      if (item.type in counts) counts[item.type as keyof typeof counts] += 1
      if (item.isActive) counts.active += 1
    }
    return counts
  }, [items])

  const listed = useMemo(() => {
    const needle = listFilter.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return items
    return items.filter((p) => {
      const neigh = neighborhoodMap.get(p.neighborhoodId) ?? ''
      const street = p.streetId ? (streetMap.get(p.streetId) ?? '') : ''
      return `${p.title} ${neigh} ${street} ${p.doorNumber}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [items, listFilter, neighborhoodMap, streetMap])

  const load = useCallback(async () => {
    const [page, neigh, streetList] = await Promise.all([
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties/mine', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
      apiFetch<Street[]>('/api/v1/streets'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    setAllStreets(streetList)
    const preferred =
      neigh.find((n) => n.name === 'Hadımköy') ??
      neigh.find((n) => n.name === 'Taşoluk') ??
      neigh[0]
    setNeighborhoodId((current) => current || preferred?.id || '')
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
      setInfo('Mülk kaydı oluşturuldu. Su aboneliği için mülkü bağlayabilirsiniz.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Mülklerim</h1>
        <p className="muted">
          38 mahallelik Arnavutköy coğrafyasından seçim yapın. Emlak borcu personel tarafından
          kesilir; ödeme <Link to="/borclar">borçlar</Link> / <Link to="/vezne">vezne</Link>{' '}
          üzerindendir.
        </p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="request-stats" aria-label="Mülk özeti">
        <div>
          <strong>{typeCounts.all}</strong>
          <span className="muted">Toplam</span>
        </div>
        <div>
          <strong>{typeCounts.Residential}</strong>
          <span className="muted">Konut</span>
        </div>
        <div>
          <strong>{typeCounts.Commercial}</strong>
          <span className="muted">Ticari</span>
        </div>
        <div>
          <strong>{typeCounts.Land}</strong>
          <span className="muted">Arsa</span>
        </div>
        <div>
          <strong>{typeCounts.active}</strong>
          <span className="muted">Aktif</span>
        </div>
      </div>

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3>Yeni mülk</h3>
        <div className="field">
          <label htmlFor="neigh-q">Mahalle ara</label>
          <input
            id="neigh-q"
            value={neighQ}
            onChange={(e) => setNeighQ(e.target.value)}
            placeholder="Örn. Hadımköy, Durusu, Merkez"
          />
        </div>
        <div className="field">
          <label htmlFor="neigh">Mahalle</label>
          <select
            id="neigh"
            value={neighborhoodId}
            onChange={(e) => setNeighborhoodId(e.target.value)}
            required
          >
            {formNeighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
                {PRIORITY_NEIGHBORHOODS.includes(n.name) ? ' ★' : ''}
              </option>
            ))}
          </select>
          <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
            ★ işaretli mahalleler sık kullanılan demo lokasyonlarıdır.{' '}
            <Link to="/muhtarliklar">Muhtarlık listesi</Link>
          </p>
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
              Bu mahallede henüz sokak kaydı yok — yine de mülk kaydedebilirsiniz.
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
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn. Hadımköy daire"
            required
          />
        </div>
        <div className="form-two-col">
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
              placeholder="Opsiyonel"
            />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !neighborhoodId}>
          {busy ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </form>

      <div className="field" style={{ maxWidth: 360 }}>
        <label htmlFor="plist-q">Kayıtlarımı filtrele</label>
        <input
          id="plist-q"
          value={listFilter}
          onChange={(e) => setListFilter(e.target.value)}
          placeholder="Başlık, mahalle, kapı…"
        />
      </div>

      <div className="stack">
        {listed.map((p) => (
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
        {listed.length === 0 ? (
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>{items.length === 0 ? 'Kayıtlı mülk yok' : 'Filtre sonucu boş'}</h3>
            <p className="muted" style={{ margin: 0 }}>
              Hadımköy veya Taşoluk seçerek ilk kaydı oluşturun; ardından{' '}
              <Link to="/su">su aboneliği</Link> bağlayabilirsiniz.
            </p>
          </div>
        ) : null}
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
  const [neighQ, setNeighQ] = useState('')
  const [subscriptionNumber, setSubscriptionNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const neighborhoodMap = useMemo(
    () => new Map(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  )
  const propertyMap = useMemo(() => new Map(properties.map((p) => [p.id, p.title])), [properties])

  const sortedNeighborhoods = useMemo(() => sortNeighborhoods(neighborhoods), [neighborhoods])
  const formNeighborhoods = useMemo(() => {
    const needle = neighQ.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return sortedNeighborhoods
    return sortedNeighborhoods.filter((n) => n.name.toLocaleLowerCase('tr-TR').includes(needle))
  }, [sortedNeighborhoods, neighQ])

  const propertiesInNeighborhood = useMemo(
    () => properties.filter((p) => p.neighborhoodId === neighborhoodId && p.isActive),
    [properties, neighborhoodId],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    for (const item of items) {
      counts[item.status] = (counts[item.status] ?? 0) + 1
    }
    return counts
  }, [items])

  const load = useCallback(async () => {
    const [page, neigh, props] = await Promise.all([
      apiFetch<Paginated<WaterSubscription>>('/api/v1/water-subscriptions/mine', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties/mine', {}, true),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    setProperties(props.items)
    const preferred =
      neigh.find((n) => n.name === 'Hadımköy') ??
      neigh.find((n) => n.name === 'Taşoluk') ??
      neigh[0]
    setNeighborhoodId((current) => current || preferred?.id || '')
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

  function suggestSubscriptionNumber() {
    const suffix = String(Math.floor(1000 + Math.random() * 9000))
    setSubscriptionNumber(`AK-${suffix}`)
  }

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
      setInfo('Su aboneliği açıldı. Borç kesimi personel panelinden yapılır.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik açılamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Su aboneliği</h1>
        <p className="muted">
          Abonelikleriniz; borçlar personel tarafından üretilir ve{' '}
          <Link to="/borclar">borçlar</Link> ekranından ödenir.
        </p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="request-stats" aria-label="Abonelik özeti">
        <div>
          <strong>{statusCounts.all ?? 0}</strong>
          <span className="muted">Toplam</span>
        </div>
        <div>
          <strong>{statusCounts.Active ?? 0}</strong>
          <span className="muted">Aktif</span>
        </div>
        <div>
          <strong>{statusCounts.Closed ?? 0}</strong>
          <span className="muted">Kapalı</span>
        </div>
        <div>
          <strong>{properties.filter((p) => p.isActive).length}</strong>
          <span className="muted">Bağlanabilir mülk</span>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="notice">
          Henüz mülkünüz yok. İsteğe bağlı bağlama için önce <Link to="/mulkler">mülk kaydı</Link>{' '}
          oluşturabilirsiniz.
        </div>
      ) : null}

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3>Yeni abonelik</h3>
        <div className="field">
          <label htmlFor="wneigh-q">Mahalle ara</label>
          <input
            id="wneigh-q"
            value={neighQ}
            onChange={(e) => setNeighQ(e.target.value)}
            placeholder="Örn. Hadımköy"
          />
        </div>
        <div className="field">
          <label htmlFor="wneigh">Mahalle</label>
          <select
            id="wneigh"
            value={neighborhoodId}
            onChange={(e) => setNeighborhoodId(e.target.value)}
            required
          >
            {formNeighborhoods.map((n) => (
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
          {neighborhoodId && propertiesInNeighborhood.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Bu mahallede aktif mülkünüz yok.
            </p>
          ) : null}
        </div>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'end' }}>
            <label htmlFor="subno">Abone no</label>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              onClick={suggestSubscriptionNumber}
            >
              AK-XXXX öner
            </button>
          </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{s.subscriptionNumber}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {neighborhoodMap.get(s.neighborhoodId) ?? 'Mahalle'}
                  {s.propertyId ? ` · ${propertyMap.get(s.propertyId) ?? 'Mülk'}` : ' · Mülksüz'}
                  {' · '}
                  {new Date(s.activatedAtUtc).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className={waterBadge(s.status)}>
                {waterStatusLabels[s.status] ?? s.status}
              </span>
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>Abonelik yok</h3>
            <p className="muted" style={{ margin: 0 }}>
              Hadımköy seçip AK-XXXX önerisiyle hızlıca demo abonelik açabilirsiniz.
            </p>
          </div>
        ) : null}
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
