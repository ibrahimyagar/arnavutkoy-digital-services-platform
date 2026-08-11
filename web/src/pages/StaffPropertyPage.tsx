import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StaffGate } from '../components/RoleGates'
import { EmptyState, PageHeader, StatRow } from '../components/ui/PageChrome'
import {
  apiFetch,
  type CitizenProperty,
  type Neighborhood,
  type Paginated,
  type Street,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

const typeLabels: Record<string, string> = {
  Residential: 'Konut',
  Commercial: 'Ticari',
  Land: 'Arsa',
}

const DEBT_PRESETS = [
  { label: 'Konut emlak', amount: '1780' },
  { label: 'Ticari emlak', amount: '4250' },
  { label: 'Arsa', amount: '960' },
  { label: 'Gecikme', amount: '320' },
] as const

function defaultDueLocal() {
  const date = new Date()
  date.setDate(date.getDate() + 45)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T09:00`
}

type ActiveFilter = 'all' | 'active' | 'inactive'
type TypeFilter = 'all' | 'Residential' | 'Commercial' | 'Land'

function StaffPropertyContent() {
  const [items, setItems] = useState<CitizenProperty[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [streets, setStreets] = useState<Street[]>([])
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [neighborhoodId, setNeighborhoodId] = useState('all')
  const [q, setQ] = useState('')
  const [debtForId, setDebtForId] = useState<string | null>(null)
  const [principal, setPrincipal] = useState('1780')
  const [dueLocal, setDueLocal] = useState(defaultDueLocal)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [page, neigh, streetList] = await Promise.all([
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties?pageSize=100', {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
      apiFetch<Street[]>('/api/v1/streets'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
    setStreets(streetList)
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Mülkler yüklenemedi.')
    })
  }, [load])

  const neighborhoodMap = useMemo(
    () => new Map(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  )
  const streetMap = useMemo(() => new Map(streets.map((s) => [s.id, s.name])), [streets])

  const counts = useMemo(() => {
    const next = {
      all: items.length,
      active: 0,
      inactive: 0,
      Residential: 0,
      Commercial: 0,
      Land: 0,
    }
    for (const item of items) {
      if (item.isActive) next.active += 1
      else next.inactive += 1
      if (item.type in next) next[item.type as keyof typeof next] += 1
    }
    return next
  }, [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return items.filter((item) => {
      if (activeFilter === 'active' && !item.isActive) return false
      if (activeFilter === 'inactive' && item.isActive) return false
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (neighborhoodId !== 'all' && item.neighborhoodId !== neighborhoodId) return false
      if (!needle) return true
      const neigh = neighborhoodMap.get(item.neighborhoodId) ?? ''
      const street = item.streetId ? (streetMap.get(item.streetId) ?? '') : ''
      return `${item.title} ${neigh} ${street} ${item.doorNumber} ${item.blockParcel} ${item.ownerUserId}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [items, activeFilter, typeFilter, neighborhoodId, q, neighborhoodMap, streetMap])

  const usedNeighborhoods = useMemo(() => {
    const ids = new Set(items.map((i) => i.neighborhoodId))
    return neighborhoods
      .filter((n) => ids.has(n.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [items, neighborhoods])

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onCreateDebt(event: FormEvent) {
    event.preventDefault()
    if (!debtForId) return
    const amount = Number(principal)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin.')
      return
    }

    await run(async () => {
      await apiFetch(
        `/api/v1/properties/${debtForId}/debts`,
        {
          method: 'POST',
          body: JSON.stringify({
            principalAmount: amount,
            dueDateUtc: new Date(dueLocal).toISOString(),
          }),
        },
        true,
      )
      setDebtForId(null)
      setPrincipal('1780')
      setDueLocal(defaultDueLocal())
    }, 'Emlak vergisi borcu oluşturuldu. Vatandaş /borclar ekranında görür.')
  }

  function openDebtForm(item: CitizenProperty) {
    setDebtForId(item.id)
    setError(null)
    setInfo(null)
    if (item.type === 'Commercial') setPrincipal('4250')
    else if (item.type === 'Land') setPrincipal('960')
    else setPrincipal('1780')
  }

  return (
    <div className="container stack page">
      <PageHeader
        title="Mülk / emlak yönetimi"
        description="Mülk kayıtları ve emlak vergisi borcu kesimi."
        actions={
          <Link className="btn btn-ghost" to="/su-yonetimi">
            Su yönetimi
          </Link>
        }
      />

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <StatRow
        items={[
          { id: 'all', label: 'Toplam', value: String(counts.all), tone: 'brand' },
          { id: 'active', label: 'Aktif', value: String(counts.active), tone: 'ok' },
          { id: 'inactive', label: 'Pasif', value: String(counts.inactive), tone: 'warn' },
          { id: 'listed', label: 'Listelenen', value: String(filtered.length), tone: 'info' },
        ]}
      />

      <div className="field">
        <label htmlFor="property-search">Ara</label>
        <input
          id="property-search"
          type="search"
          placeholder="Başlık, mahalle, sokak, kapı, ada/parsel…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="desk-tabs" role="tablist" aria-label="Aktiflik filtresi">
        {(
          [
            { id: 'active', label: 'Aktif', count: counts.active },
            { id: 'inactive', label: 'Pasif', count: counts.inactive },
            { id: 'all', label: 'Tümü', count: counts.all },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.id}
            className={activeFilter === filter.id ? 'is-active' : undefined}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
            <span>{filter.count}</span>
          </button>
        ))}
      </div>

      <div className="dept-chip-row" role="group" aria-label="Tür filtresi">
        {(
          [
            { id: 'all', label: 'Tüm türler', count: counts.all },
            { id: 'Residential', label: 'Konut', count: counts.Residential },
            { id: 'Commercial', label: 'Ticari', count: counts.Commercial },
            { id: 'Land', label: 'Arsa', count: counts.Land },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={typeFilter === filter.id ? 'is-active' : undefined}
            onClick={() => setTypeFilter(filter.id)}
          >
            {filter.label}
            <span>{filter.count}</span>
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="property-neigh">Mahalle</label>
        <select
          id="property-neigh"
          value={neighborhoodId}
          onChange={(e) => setNeighborhoodId(e.target.value)}
        >
          <option value="all">Tüm mahalleler</option>
          {usedNeighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      <div className="stack">
        {filtered.map((item) => (
          <article key={item.id} className="list-row">
            <div className="list-row-top">
              <div>
                <h3>{item.title}</h3>
                <p className="muted list-row-meta">
                  {typeLabels[item.type] ?? item.type}
                  {' · '}
                  {neighborhoodMap.get(item.neighborhoodId) ?? 'Mahalle'}
                  {item.streetId ? ` · ${streetMap.get(item.streetId) ?? 'Sokak'}` : ''}
                  {' · Kapı '}
                  {item.doorNumber}
                  {item.blockParcel ? ` · ${item.blockParcel}` : ''}
                </p>
                <p className="muted list-row-meta">Sahip: {item.ownerUserId.slice(0, 8)}…</p>
              </div>
              <span className={item.isActive ? 'badge badge-ok' : 'badge'}>
                {item.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            {debtForId === item.id ? (
              <form className="stack" onSubmit={(e) => void onCreateDebt(e)}>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Emlak vergisi borcu</h3>
                <div className="dept-chip-row" role="group" aria-label="Hazır tutarlar">
                  {DEBT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={principal === preset.amount ? 'is-active' : undefined}
                      onClick={() => setPrincipal(preset.amount)}
                    >
                      {preset.label}
                      <span>₺{preset.amount}</span>
                    </button>
                  ))}
                </div>
                <div className="form-two-col">
                  <div className="field">
                    <label htmlFor={`principal-${item.id}`}>Tutar (₺)</label>
                    <input
                      id={`principal-${item.id}`}
                      type="number"
                      min="1"
                      step="0.01"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`due-${item.id}`}>Vade</label>
                    <input
                      id={`due-${item.id}`}
                      type="datetime-local"
                      value={dueLocal}
                      onChange={(e) => setDueLocal(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="list-row-actions">
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    Borç kes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() => setDebtForId(null)}
                  >
                    Vazgeç
                  </button>
                </div>
              </form>
            ) : item.isActive ? (
              <div className="list-row-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => openDebtForm(item)}
                >
                  Emlak borcu kes
                </button>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Pasif mülke borç kesilemez.
              </p>
            )}
          </article>
        ))}
        {filtered.length === 0 ? (
          <EmptyState
            title="Bu filtrede mülk yok"
            description="Vatandaşın /mulkler üzerinden kayıt oluşturduğundan emin olun."
          />
        ) : null}
      </div>
    </div>
  )
}

export function StaffPropertyPage() {
  return (
    <RequireAuth>
      <StaffGate>
        <StaffPropertyContent />
      </StaffGate>
    </RequireAuth>
  )
}
