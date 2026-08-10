import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StaffGate } from '../components/RoleGates'
import { apiFetch, type Neighborhood, type Paginated, type WaterSubscription } from '../lib/api'
import { RequireAuth } from './PanelPage'

const STATUS_LABELS: Record<string, string> = {
  Active: 'Aktif',
  Suspended: 'Askıda',
  Closed: 'Kapalı',
}

const DEBT_PRESETS = [
  { label: 'Aylık su', amount: '150' },
  { label: '2 aylık', amount: '295' },
  { label: 'Yüksek tüketim', amount: '480' },
  { label: 'Gecikme', amount: '85' },
] as const

type StatusFilter = 'all' | 'Active' | 'Suspended' | 'Closed'

function statusBadgeClass(status: string) {
  if (status === 'Active') return 'badge badge-ok'
  if (status === 'Suspended') return 'badge badge-warn'
  if (status === 'Closed') return 'badge badge-danger'
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Active')
  const [neighborhoodId, setNeighborhoodId] = useState('all')
  const [q, setQ] = useState('')
  const [debtForId, setDebtForId] = useState<string | null>(null)
  const [principal, setPrincipal] = useState('150')
  const [dueLocal, setDueLocal] = useState(defaultDueLocal)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [page, neigh] = await Promise.all([
      apiFetch<Paginated<WaterSubscription>>(
        '/api/v1/water-subscriptions?pageSize=100',
        {},
        true,
      ),
      apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
    ])
    setItems(page.items)
    setNeighborhoods(neigh)
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Abonelikler yüklenemedi.')
    })
  }, [load])

  const neighborhoodMap = useMemo(
    () => new Map(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  )

  const counts = useMemo(() => {
    const next: Record<string, number> = {
      all: items.length,
      Active: 0,
      Suspended: 0,
      Closed: 0,
    }
    for (const item of items) {
      next[item.status] = (next[item.status] ?? 0) + 1
    }
    return next
  }, [items])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (neighborhoodId !== 'all' && item.neighborhoodId !== neighborhoodId) return false
      if (!needle) return true
      const neigh = neighborhoodMap.get(item.neighborhoodId) ?? ''
      return `${item.subscriptionNumber} ${neigh} ${item.subscriberUserId}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [items, statusFilter, neighborhoodId, q, neighborhoodMap])

  const usedNeighborhoods = useMemo(() => {
    const ids = new Set(items.map((i) => i.neighborhoodId))
    return neighborhoods
      .filter((n) => ids.has(n.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [items, neighborhoods])

  async function run(id: string, action: () => Promise<unknown>, okMessage: string) {
    setBusyId(id)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusyId(null)
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

    await run(
      debtForId,
      async () => {
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
      },
      'Su borcu oluşturuldu. Vatandaş /borclar ekranında görür.',
    )
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Su abonelik yönetimi</h1>
        <p className="muted">
          Abonelik durumunu yönetin; aktif kayıtlara su borcu kesin.{' '}
          <Link to="/mulk-yonetimi">Mülk yönetimi</Link>
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="stats-strip" aria-label="Abonelik özeti">
        <div>
          <span className="muted">Toplam</span>
          <strong>{counts.all}</strong>
        </div>
        <div>
          <span className="muted">Aktif</span>
          <strong>{counts.Active ?? 0}</strong>
        </div>
        <div>
          <span className="muted">Askıda</span>
          <strong>{counts.Suspended ?? 0}</strong>
        </div>
        <div>
          <span className="muted">Listelenen</span>
          <strong>{filtered.length}</strong>
        </div>
      </div>

      <div className="field">
        <label htmlFor="water-search">Ara</label>
        <input
          id="water-search"
          type="search"
          placeholder="Abone no, mahalle…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="desk-tabs" role="tablist" aria-label="Durum filtresi">
        {(
          [
            { id: 'Active', label: 'Aktif' },
            { id: 'Suspended', label: 'Askıda' },
            { id: 'Closed', label: 'Kapalı' },
            { id: 'all', label: 'Tümü' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.id}
            className={statusFilter === filter.id ? 'is-active' : undefined}
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label}
            <span>{filter.id === 'all' ? counts.all : (counts[filter.id] ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="water-neigh">Mahalle</label>
        <select
          id="water-neigh"
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
        {filtered.map((item) => {
          const busy = busyId === item.id
          return (
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
                    Abone kimliği: {item.subscriberUserId.slice(0, 8)}…
                    {item.propertyId ? ` · Mülk ${item.propertyId.slice(0, 8)}…` : ''}
                  </p>
                </div>
                <span className={statusBadgeClass(item.status)}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>

              {debtForId === item.id ? (
                <form className="stack" onSubmit={(e) => void onCreateDebt(e)}>
                  <h3 style={{ margin: 0 }}>Su borcu oluştur</h3>
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
                        disabled={Boolean(busyId)}
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
                        disabled={Boolean(busyId)}
                        onClick={() =>
                          void run(
                            item.id,
                            () =>
                              apiFetch(
                                `/api/v1/water-subscriptions/${item.id}/suspend`,
                                { method: 'POST' },
                                true,
                              ),
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
                      disabled={Boolean(busyId)}
                      onClick={() =>
                        void run(
                          item.id,
                          () =>
                            apiFetch(
                              `/api/v1/water-subscriptions/${item.id}/reactivate`,
                              { method: 'POST' },
                              true,
                            ),
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
                      disabled={Boolean(busyId)}
                      onClick={() =>
                        void run(
                          item.id,
                          () =>
                            apiFetch(
                              `/api/v1/water-subscriptions/${item.id}/close`,
                              { method: 'POST' },
                              true,
                            ),
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
          )
        })}
        {filtered.length === 0 ? (
          <p className="muted">
            Bu filtrede abonelik yok. Vatandaşın `/su` üzerinden abonelik açtığından emin olun.
          </p>
        ) : null}
      </div>
    </div>
  )
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
