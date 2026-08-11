import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ActionCard,
  ActionCardGrid,
  PageHeader,
  StatRow,
} from '../components/ui/PageChrome'
import {
  apiFetch,
  type Debt,
  type Paginated,
  type TransportCard,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function CashDeskContent() {
  const [openDebts, setOpenDebts] = useState(0)
  const [debtTotal, setDebtTotal] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)
  const [cards, setCards] = useState(0)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all([
      apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true),
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
    ])
      .then(([debts, transportCards]) => {
        if (cancelled) return
        const unpaid = debts.items.filter((d) => d.status === 'Unpaid')
        const now = Date.now()
        setOpenDebts(unpaid.length)
        setDebtTotal(unpaid.reduce((sum, d) => sum + d.totalPayable, 0))
        setOverdueCount(unpaid.filter((d) => new Date(d.dueDateUtc).getTime() < now).length)
        setCards(transportCards.length)
        setBalance(transportCards.reduce((sum, c) => sum + c.balance, 0))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Vezne özeti yüklenemedi.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="container stack page">
      <PageHeader
        title="Dijital vezne"
        description="Borç ödeme ve ulaşım kartı bakiye işlemleri — demo ödeme altyapısı."
      />

      {error ? <div className="error-box">{error}</div> : null}

      <StatRow
        loading={loading}
        items={[
          {
            id: 'open',
            label: 'Açık borç',
            value: String(openDebts),
            tone: openDebts > 0 ? 'warn' : 'ok',
          },
          {
            id: 'total',
            label: 'Ödenecek',
            value: money(debtTotal),
            tone: 'accent',
          },
          {
            id: 'overdue',
            label: 'Vadesi geçmiş',
            value: String(overdueCount),
            tone: overdueCount > 0 ? 'warn' : 'brand',
          },
          {
            id: 'balance',
            label: 'Kart bakiyesi',
            value: money(balance),
            tone: 'info',
          },
        ]}
      />

      {!loading && openDebts > 0 ? (
        <div className="notice">
          {overdueCount > 0
            ? `${overdueCount} borcun vadesi geçmiş; gecikme faizi toplam tutara yansır.`
            : `${openDebts} açık borcunuz var.`}{' '}
          <Link to="/borclar">Borçları öde</Link>
        </div>
      ) : null}

      {!loading && openDebts === 0 ? (
        <div className="notice">
          Açık borç yok. Kart bakiyesi için <Link to="/ulasim">ulaşım</Link> ekranına gidin.
        </div>
      ) : null}

      <ActionCardGrid>
        <ActionCard
          to="/borclar"
          title="Su / emlak borcu öde"
          description="Gecikme faizi dahil tutarı kart ile kapatın."
          meta={loading ? '…' : `${openDebts} açık · ${money(debtTotal)}`}
          highlight={openDebts > 0}
        />
        <ActionCard
          to="/ulasim"
          title="Kart bakiyesi yükle"
          description="Ulaşım kartınıza tutar tanımlayın."
          meta={loading ? '…' : `${cards} kart · ${money(balance)}`}
        />
        <ActionCard
          to="/binis"
          title="Biniş simülasyonu"
          description="Hat seçip kartla biniş deneyin."
          meta="Hat → kart → onay"
        />
        <ActionCard to="/panel" title="Panele dön" description="Borç ve bakiye özetine git." />
      </ActionCardGrid>
    </div>
  )
}

export function DigitalCashDeskPage() {
  return (
    <RequireAuth>
      <CashDeskContent />
    </RequireAuth>
  )
}
