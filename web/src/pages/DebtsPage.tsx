import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardPaymentForm, type CardPaymentValues } from '../components/CardPaymentForm'
import { apiFetch, type Debt, type Paginated } from '../lib/api'
import { RequireAuth } from './PanelPage'

const typeLabels: Record<string, string> = {
  Water: 'Su',
  Property: 'Emlak',
}

const statusLabels: Record<string, string> = {
  Unpaid: 'Ödenmedi',
  Paid: 'Ödendi',
}

type StatusFilter = 'all' | 'Unpaid' | 'Paid'
type TypeFilter = 'all' | 'Water' | 'Property'

function statusBadge(status: string) {
  if (status === 'Paid') return 'badge badge-ok'
  if (status === 'Unpaid') return 'badge badge-warn'
  return 'badge'
}

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function isOverdue(debt: Debt) {
  return debt.status === 'Unpaid' && new Date(debt.dueDateUtc).getTime() < Date.now()
}

function DebtsContent() {
  const [items, setItems] = useState<Debt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Unpaid')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const load = useCallback(async () => {
    const page = await apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=100', {}, true)
    setItems(page.items)
  }, [])

  useEffect(() => {
    setLoading(true)
    void load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Borçlar yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [load])

  const counts = useMemo(() => {
    const next = {
      all: items.length,
      Unpaid: 0,
      Paid: 0,
      Water: 0,
      Property: 0,
      overdue: 0,
      unpaidTotal: 0,
    }
    for (const debt of items) {
      if (debt.status === 'Unpaid') {
        next.Unpaid += 1
        next.unpaidTotal += debt.totalPayable
        if (isOverdue(debt)) next.overdue += 1
      } else if (debt.status === 'Paid') {
        next.Paid += 1
      }
      if (debt.type === 'Water') next.Water += 1
      if (debt.type === 'Property') next.Property += 1
    }
    return next
  }, [items])

  const filtered = useMemo(() => {
    return items
      .filter((debt) => {
        if (statusFilter !== 'all' && debt.status !== statusFilter) return false
        if (typeFilter !== 'all' && debt.type !== typeFilter) return false
        return true
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Unpaid' ? -1 : 1
        return new Date(a.dueDateUtc).getTime() - new Date(b.dueDateUtc).getTime()
      })
  }, [items, statusFilter, typeFilter])

  async function pay(values: CardPaymentValues) {
    if (!payingId) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        `/api/v1/debts/${payingId}/payments`,
        {
          method: 'POST',
          body: JSON.stringify(values),
        },
        true,
      )
      setPayingId(null)
      setInfo('Ödeme alındı (demo). Makbuz yerine bu listedeki “Ödendi” durumu geçer.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme başarısız.')
    } finally {
      setBusy(false)
    }
  }

  const selected = items.find((d) => d.id === payingId)

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Borçlarım</h1>
        <p className="muted">
          Dijital vezne üzerinden kart ile ödeme. <Link to="/vezne">Vezne hub</Link>
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      {loading ? (
        <div className="stats-strip stats-strip--skeleton" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <span className="skeleton-line skeleton-line--sm" />
              <span className="skeleton-line skeleton-line--lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-strip" aria-label="Borç özeti">
          <div>
            <span className="muted">Açık</span>
            <strong>{counts.Unpaid}</strong>
          </div>
          <div>
            <span className="muted">Ödenecek</span>
            <strong>{money(counts.unpaidTotal)}</strong>
          </div>
          <div>
            <span className="muted">Vadesi geçmiş</span>
            <strong>{counts.overdue}</strong>
          </div>
          <div>
            <span className="muted">Ödenen</span>
            <strong>{counts.Paid}</strong>
          </div>
        </div>
      )}

      <div className="desk-tabs" role="tablist" aria-label="Durum filtresi">
        {(
          [
            { id: 'Unpaid', label: 'Ödenmedi', count: counts.Unpaid },
            { id: 'Paid', label: 'Ödendi', count: counts.Paid },
            { id: 'all', label: 'Tümü', count: counts.all },
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
            <span>{filter.count}</span>
          </button>
        ))}
      </div>

      <div className="dept-chip-row" role="group" aria-label="Tür filtresi">
        {(
          [
            { id: 'all', label: 'Tüm türler', count: counts.all },
            { id: 'Water', label: 'Su', count: counts.Water },
            { id: 'Property', label: 'Emlak', count: counts.Property },
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

      {payingId && selected ? (
        <div className="panel stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'start' }}>
            <div>
              <h3 style={{ margin: 0 }}>
                Ödeme — {typeLabels[selected.type] ?? selected.type}
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Toplam: {money(selected.totalPayable)}
                {isOverdue(selected) ? ' · vadesi geçmiş' : ''}
              </p>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => setPayingId(null)}>
              Vazgeç
            </button>
          </div>
          <CardPaymentForm
            submitLabel={`${money(selected.totalPayable)} öde`}
            busy={busy}
            onSubmit={pay}
          />
        </div>
      ) : null}

      <div className="stack">
        {filtered.map((debt) => {
          const overdue = isOverdue(debt)
          return (
            <article key={debt.id} className="panel" style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{typeLabels[debt.type] ?? debt.type}</h3>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Vade: {new Date(debt.dueDateUtc).toLocaleDateString('tr-TR')}
                    {debt.paidAtUtc
                      ? ` · Ödeme: ${new Date(debt.paidAtUtc).toLocaleDateString('tr-TR')}`
                      : ''}
                  </p>
                  {overdue ? (
                    <p className="muted" style={{ margin: '0.25rem 0 0', color: 'var(--brand)' }}>
                      Vadesi geçmiş — gecikme faizi toplamda.
                    </p>
                  ) : null}
                </div>
                <span className={statusBadge(debt.status)}>
                  {statusLabels[debt.status] ?? debt.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div className="muted">Asıl: {money(debt.principalAmount)}</div>
                  <div className="muted">Faiz: {money(debt.overdueInterest)}</div>
                  <strong>Toplam: {money(debt.totalPayable)}</strong>
                </div>
                {debt.status === 'Unpaid' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setPayingId(debt.id)
                      setError(null)
                      setInfo(null)
                    }}
                  >
                    Öde
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
        {!loading && filtered.length === 0 ? (
          <p className="muted">
            Bu filtrede borç yok. Personel{' '}
            <Link to="/su-yonetimi">su</Link> veya <Link to="/mulk-yonetimi">mülk</Link>{' '}
            yönetiminden borç kesebilir (görevli hesabı gerekir).
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function DebtsPage() {
  return (
    <RequireAuth>
      <DebtsContent />
    </RequireAuth>
  )
}
