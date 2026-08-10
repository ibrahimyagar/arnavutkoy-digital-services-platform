import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch, type Neighborhood, type Paginated, type WaterSubscription } from '../lib/api'
import { isStaff } from '../lib/roles'
import { RequireAuth } from './PanelPage'

const STATUS_LABELS: Record<string, string> = {
  Active: 'Aktif',
  Suspended: 'Askıda',
  Closed: 'Kapalı',
}

function statusBadgeClass(status: string) {
  if (status === 'Active') return 'badge badge-ok'
  if (status === 'Suspended') return 'badge badge-warn'
  return 'badge'
}

function defaultDueLocal() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T09:00`
}

function StaffWaterContent() {
  const [items, setItems] = useState<WaterSubscription[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Suspended' | 'Closed'>('all')
  const [debtForId, setDebtForId] = useState<string | null>(null)
  const [principal, setPrincipal] = useState('150')
  const [dueLocal, setDueLocal] = useState(defaultDueLocal)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const query =
      statusFilter === 'all'
        ? '/api/v1/water-subscriptions?pageSize=50'
        : `/api/v1/water-subscriptions?pageSize=50&status=${statusFilter}`
    const [page, neigh] = await Promise.all([
      apiFetch<Paginated<WaterSubscription>>(query, {}, true),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
  }, [statusFilter])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Abonelikler yüklenemedi.')
    })
  }, [load])

  const neighborhoodMap = useMemo(
    () => new Map(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  )

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
        `/api/v1/water-subscriptions/${debtForId}/debts`,
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
      setPrincipal('150')
      setDueLocal(defaultDueLocal())
    }, 'Su borcu oluşturuldu. Vatandaş /borclar ekranında görür.')
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Su abonelik yönetimi</h1>
        <p className="muted">Aktif aboneliklere borç kesin, durumu yönetin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="filter-row" role="tablist" aria-label="Abonelik durum filtresi">
        {(
          [
            { id: 'all', label: 'Tümü' },
            { id: 'Active', label: 'Aktif' },
            { id: 'Suspended', label: 'Askıda' },
            { id: 'Closed', label: 'Kapalı' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.id}
            className={statusFilter === filter.id ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{item.subscriptionNumber}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {neighborhoodMap.get(item.neighborhoodId) ?? 'Mahalle'}
                  {' · '}
                  {new Date(item.activatedAtUtc).toLocaleDateString('tr-TR')}
                  {item.closedAtUtc
                    ? ` · Kapandı ${new Date(item.closedAtUtc).toLocaleDateString('tr-TR')}`
                    : ''}
                </p>
                <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
                  Abone: {item.subscriberUserId.slice(0, 8)}…
                </p>
              </div>
              <span className={statusBadgeClass(item.status)}>
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            </div>

            {debtForId === item.id ? (
              <form className="stack" onSubmit={(e) => void onCreateDebt(e)}>
                <h3 style={{ margin: 0 }}>Su borcu oluştur</h3>
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
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {item.status === 'Active' ? (
                  <>
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
                      Borç kes
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            apiFetch(`/api/v1/water-subscriptions/${item.id}/suspend`, {
                              method: 'POST',
                            }, true),
                          'Abonelik askıya alındı.',
                        )
                      }
                    >
                      Askıya al
                    </button>
                  </>
                ) : null}
                {item.status === 'Suspended' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          apiFetch(`/api/v1/water-subscriptions/${item.id}/reactivate`, {
                            method: 'POST',
                          }, true),
                        'Abonelik yeniden aktif.',
                      )
                    }
                  >
                    Yeniden aktifleştir
                  </button>
                ) : null}
                {item.status !== 'Closed' ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          apiFetch(`/api/v1/water-subscriptions/${item.id}/close`, {
                            method: 'POST',
                          }, true),
                        'Abonelik kapatıldı.',
                      )
                    }
                  >
                    Kapat
                  </button>
                ) : null}
              </div>
            )}
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Bu filtrede abonelik yok.</p> : null}
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

export function StaffWaterPage() {
  return (
    <RequireAuth>
      <StaffGate>
        <StaffWaterContent />
      </StaffGate>
    </RequireAuth>
  )
}
