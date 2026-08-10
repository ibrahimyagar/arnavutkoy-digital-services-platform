import { useEffect, useState } from 'react'
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

function statusBadge(status: string) {
  if (status === 'Paid') return 'badge badge-ok'
  if (status === 'Unpaid') return 'badge badge-warn'
  return 'badge'
}

function DebtsContent() {
  const [data, setData] = useState<Paginated<Debt> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      const page = await apiFetch<Paginated<Debt>>('/api/v1/debts/mine', {}, true)
      setData(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Borçlar yüklenemedi.')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function pay(debtId: string) {
    setBusyId(debtId)
    setError(null)
    try {
      await apiFetch(
        `/api/v1/debts/${debtId}/payments`,
        {
          method: 'POST',
          body: JSON.stringify({
            cardHolderName: 'Demo Kart Sahibi',
            cardNumber: '4111111111111111',
            expiryMonthYear: '12/30',
            cvv: '123',
          }),
        },
        true,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme başarısız.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Borçlarım</h1>
        <p className="muted">Demo kart ile ödeme simülasyonu yapılır; gerçek tahsilat yoktur.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="stack">
        {data?.items.map((debt) => (
          <article key={debt.id} className="panel" style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{typeLabels[debt.type] ?? debt.type}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Vade: {new Date(debt.dueDateUtc).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className={statusBadge(debt.status)}>
                {statusLabels[debt.status] ?? debt.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <div className="muted">Asıl: ₺{debt.principalAmount.toFixed(2)}</div>
                <div className="muted">Faiz: ₺{debt.overdueInterest.toFixed(2)}</div>
                <strong>Toplam: ₺{debt.totalPayable.toFixed(2)}</strong>
              </div>
              {debt.status === 'Unpaid' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busyId === debt.id}
                  onClick={() => void pay(debt.id)}
                >
                  {busyId === debt.id ? 'Ödeniyor…' : 'Öde'}
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {data && data.items.length === 0 ? <p className="muted">Kayıtlı borç yok.</p> : null}
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
