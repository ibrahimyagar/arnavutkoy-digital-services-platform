import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Dijital vezne</h1>
        <p className="muted">
          Borç tahsilatı ve ulaşım kartı bakiye yükleme. Kart formu demo PSP üzerinden işlenir.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {loading ? (
        <div className="stats-strip stats-strip--skeleton" aria-busy="true" aria-label="Vezne özeti">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <span className="skeleton-line skeleton-line--sm" />
              <span className="skeleton-line skeleton-line--lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-strip" aria-label="Vezne özeti">
          <div>
            <span className="muted">Açık borç</span>
            <strong>{openDebts}</strong>
          </div>
          <div>
            <span className="muted">Ödenecek</span>
            <strong>{money(debtTotal)}</strong>
          </div>
          <div>
            <span className="muted">Vadesi geçmiş</span>
            <strong>{overdueCount}</strong>
          </div>
          <div>
            <span className="muted">Kart bakiyesi</span>
            <strong>{money(balance)}</strong>
          </div>
        </div>
      )}

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
          Açık borç yok. Su / emlak borcu için personelin kayıt kesmesi gerekir; kart bakiyesi için{' '}
          <Link to="/ulasim">ulaşım</Link> ekranına gidin.
        </div>
      ) : null}

      <div className="panel-link-grid">
        <Link
          to="/borclar"
          className={`panel panel-link${openDebts > 0 ? ' is-highlight' : ''}`}
        >
          <h3>Su / emlak borcu öde</h3>
          <p className="muted">Gecikme faizi dahil tutarı kart ile kapatın.</p>
          <strong className="panel-link-meta">
            {loading ? '…' : `${openDebts} açık · ${money(debtTotal)}`}
          </strong>
        </Link>
        <Link to="/ulasim" className="panel panel-link">
          <h3>Kart bakiyesi yükle</h3>
          <p className="muted">Ulaşım kartınıza tutar tanımlayın.</p>
          <strong className="panel-link-meta">
            {loading ? '…' : `${cards} kart · ${money(balance)}`}
          </strong>
        </Link>
        <Link to="/binis" className="panel panel-link">
          <h3>Biniş simülasyonu</h3>
          <p className="muted">Hat seçip kartla biniş deneyin.</p>
          <strong className="panel-link-meta">Hat → kart → onay</strong>
        </Link>
        <Link to="/panel" className="panel panel-link">
          <h3>Panele dön</h3>
          <p className="muted">Canlı borç ve bakiye özetine git.</p>
        </Link>
      </div>

      <div className="notice">
        Referans projedeki “dijital vezne” akışının karşılığıdır. Gerçek banka / 3D Secure yoktur.
      </div>
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
