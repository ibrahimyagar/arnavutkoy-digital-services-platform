import { useEffect, useState, type FormEvent } from 'react'
import {
  apiFetch,
  type CitizenProperty,
  type Neighborhood,
  type Paginated,
  type WaterSubscription,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

function PropertiesContent() {
  const [items, setItems] = useState<CitizenProperty[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [title, setTitle] = useState('')
  const [doorNumber, setDoorNumber] = useState('')
  const [blockParcel, setBlockParcel] = useState('')
  const [type, setType] = useState('Residential')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function load() {
    const [page, neigh] = await Promise.all([
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties/mine', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    if (!neighborhoodId && neigh[0]) setNeighborhoodId(neigh[0].id)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Mülkler yüklenemedi.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        '/api/v1/properties',
        {
          method: 'POST',
          body: JSON.stringify({
            neighborhoodId,
            streetId: null,
            type,
            title,
            doorNumber,
            blockParcel,
          }),
        },
        true,
      )
      setTitle('')
      setDoorNumber('')
      setBlockParcel('')
      setInfo('Mülk kaydı oluşturuldu.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Mülklerim</h1>
        <p className="muted">Mahalle bazlı mülk kayıtlarınız.</p>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3>Yeni mülk</h3>
        <div className="field">
          <label htmlFor="neigh">Mahalle</label>
          <select id="neigh" value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)} required>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
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
          <input id="door" value={doorNumber} onChange={(e) => setDoorNumber(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="parcel">Ada/parsel</label>
          <input id="parcel" value={blockParcel} onChange={(e) => setBlockParcel(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit">
          Kaydet
        </button>
      </form>

      <div className="stack">
        {items.map((p) => (
          <article key={p.id} className="panel">
            <h3>{p.title}</h3>
            <p className="muted">
              {p.type} · Kapı {p.doorNumber} · {p.blockParcel || '—'}
            </p>
            <span className={p.isActive ? 'badge badge-ok' : 'badge'}>
              {p.isActive ? 'Aktif' : 'Pasif'}
            </span>
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Kayıtlı mülk yok.</p> : null}
      </div>
    </div>
  )
}

function WaterContent() {
  const [items, setItems] = useState<WaterSubscription[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [subscriptionNumber, setSubscriptionNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function load() {
    const [page, neigh] = await Promise.all([
      apiFetch<Paginated<WaterSubscription>>('/api/v1/water-subscriptions/mine', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    if (!neighborhoodId && neigh[0]) setNeighborhoodId(neigh[0].id)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Abonelikler yüklenemedi.')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        '/api/v1/water-subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            neighborhoodId,
            propertyId: null,
            subscriptionNumber,
          }),
        },
        true,
      )
      setSubscriptionNumber('')
      setInfo('Su aboneliği açıldı.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik açılamadı.')
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
          <select id="wneigh" value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)} required>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
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
        <button className="btn btn-primary" type="submit">
          Abonelik aç
        </button>
      </form>

      <div className="stack">
        {items.map((s) => (
          <article key={s.id} className="panel">
            <h3>{s.subscriptionNumber}</h3>
            <p className="muted">
              {new Date(s.activatedAtUtc).toLocaleDateString('tr-TR')} · {s.status}
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
