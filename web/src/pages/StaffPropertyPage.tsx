import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  apiFetch,
  type CitizenProperty,
  type Neighborhood,
  type Paginated,
  type Street,
} from '../lib/api'
import { isStaff } from '../lib/roles'
import { RequireAuth } from './PanelPage'

const typeLabels: Record<string, string> = {
  Residential: 'Konut',
  Commercial: 'Ticari',
  Land: 'Arsa',
}

function defaultDueLocal() {
  const date = new Date()
  date.setDate(date.getDate() + 45)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T09:00`
}

function StaffPropertyContent() {
  const [items, setItems] = useState<CitizenProperty[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [streets, setStreets] = useState<Street[]>([])
  const [activeOnly, setActiveOnly] = useState<'all' | 'active' | 'inactive'>('active')
  const [debtForId, setDebtForId] = useState<string | null>(null)
  const [principal, setPrincipal] = useState('1780')
  const [dueLocal, setDueLocal] = useState(defaultDueLocal)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [page, neigh, streetList] = await Promise.all([
      apiFetch<Paginated<CitizenProperty>>('/api/v1/properties?pageSize=50', {}, true),
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

  const filtered = useMemo(() => {
    if (activeOnly === 'active') return items.filter((p) => p.isActive)
    if (activeOnly === 'inactive') return items.filter((p) => !p.isActive)
    return items
  }, [items, activeOnly])

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

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Mülk / emlak yönetimi</h1>
        <p className="muted">Aktif mülklere emlak vergisi borcu kesin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="filter-row" role="tablist" aria-label="Mülk durumu filtresi">
        {(
          [
            { id: 'active', label: 'Aktif' },
            { id: 'inactive', label: 'Pasif' },
            { id: 'all', label: 'Tümü' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={activeOnly === filter.id}
            className={activeOnly === filter.id ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveOnly(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="stack">
        {filtered.map((item) => (
          <article key={item.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{item.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {typeLabels[item.type] ?? item.type}
                  {' · '}
                  {neighborhoodMap.get(item.neighborhoodId) ?? 'Mahalle'}
                  {item.streetId ? ` · ${streetMap.get(item.streetId) ?? 'Sokak'}` : ''}
                  {' · Kapı '}
                  {item.doorNumber}
                </p>
                <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
                  Sahip: {item.ownerUserId.slice(0, 8)}…
                </p>
              </div>
              <span className={item.isActive ? 'badge badge-ok' : 'badge'}>
                {item.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            {debtForId === item.id ? (
              <form className="stack" onSubmit={(e) => void onCreateDebt(e)}>
                <h3 style={{ margin: 0 }}>Emlak vergisi borcu</h3>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
              <div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => {
                    setDebtForId(item.id)
                    setError(null)
                    setInfo(null)
                  }}
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
        {filtered.length === 0 ? <p className="muted">Bu filtrede mülk yok.</p> : null}
      </div>
    </div>
  )
}

function StaffGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !isStaff(user.roles)) {
    return <Navigate to="/panel" replace />
  }
  return children
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
