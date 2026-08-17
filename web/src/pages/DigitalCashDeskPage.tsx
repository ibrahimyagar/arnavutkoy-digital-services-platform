import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardPaymentForm, type CardPaymentValues } from '../components/CardPaymentForm'
import { TransportContinue, TransportNav } from '../components/transport/TransportChrome'
import { apiFetch, type Debt, type Paginated, type TransportCard } from '../lib/api'
import { receiptCode } from '../lib/transportReceipts'
import { RequireAuth } from './PanelPage'
import './bus-lines.css'
import './transport-wallet.css'

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

const TYPE_LABEL: Record<string, string> = {
  Water: 'Su',
  Property: 'Emlak vergisi',
}

type ServiceId = 'menu' | 'debts' | 'property' | 'water' | 'ads' | 'result'

type PayResult = {
  id: string
  title: string
  amount: number
  at: string
}

function CashDeskContent() {
  const [service, setService] = useState<ServiceId>('menu')
  const [debts, setDebts] = useState<Debt[]>([])
  const [cards, setCards] = useState<TransportCard[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<PayResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [debtPage, transportCards] = await Promise.all([
      apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true),
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
    ])
    setDebts(debtPage.items)
    setCards(transportCards)
  }

  useEffect(() => {
    setLoading(true)
    void load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Vezne özeti yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const unpaid = debts.filter((debt) => debt.status === 'Unpaid')
  const propertyOpen = unpaid.filter((debt) => debt.type === 'Property')
  const waterOpen = unpaid.filter((debt) => debt.type === 'Water')
  const visible = useMemo(() => {
    if (service === 'property') return propertyOpen
    if (service === 'water') return waterOpen
    if (service === 'debts') return unpaid
    return []
  }, [service, propertyOpen, waterOpen, unpaid])
  const selected = debts.find((debt) => debt.id === selectedId)
  const balance = cards.reduce((sum, card) => sum + card.balance, 0)

  async function pay(values: CardPaymentValues) {
    if (!selected) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch(
        `/api/v1/debts/${selected.id}/payments`,
        { method: 'POST', body: JSON.stringify(values) },
        true,
      )
      setResult({
        id: selected.id,
        title: TYPE_LABEL[selected.type] ?? 'Belediye borcu',
        amount: selected.totalPayable,
        at: new Date().toISOString(),
      })
      setService('result')
      setSelectedId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page wallet">
      <TransportNav />
      <header>
        <p className="tx-kicker">Dijital vezne</p>
        <h1>Ödeme masası</h1>
        <p className="tx-muted">
          Bu işlem portföy/demo ortamıdır. Gerçek ödeme alınmamaktadır. Emlak ve su borçları kayıtlı borç API’sine
          bağlıdır; ilan/reklam tahsilatı bu demoda yoktur.
        </p>
      </header>

      {error ? (
        <div className="error-box">
          {error}{' '}
          <button type="button" className="btn btn-ghost" onClick={() => void load()}>
            Tekrar dene
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="stack" aria-busy="true" aria-label="Vezne yükleniyor">
          <span className="skeleton-line skeleton-line--xl" />
          <span className="skeleton-line skeleton-line--lg" />
        </div>
      ) : null}

      <div className="tx-ruler" aria-label="Vezne özeti">
        <p>
          <strong>{loading ? '—' : unpaid.length}</strong>
          <span>Açık borç</span>
        </p>
        <p>
          <strong>{loading ? '—' : money(unpaid.reduce((sum, debt) => sum + debt.totalPayable, 0))}</strong>
          <span>Ödenecek</span>
        </p>
        <p>
          <strong>{loading ? '—' : cards.length}</strong>
          <span>Ulaşım kartı</span>
        </p>
        <p>
          <strong>{loading ? '—' : money(balance)}</strong>
          <span>Kart bakiyesi</span>
        </p>
      </div>

      {service === 'menu' ? (
        <ol className="tx-desk-list">
          <li>
            <strong>Ulaşım kartı bakiye</strong>
            <span>Kart yükleme akışı kartlarım ekranındadır. Demo tahsilat.</span>
            <Link to="/ulasim#yukle">Yükle</Link>
          </li>
          <li>
            <strong>Belediye borcu</strong>
            <span>{unpaid.length} açık kayıt · su ve emlak birlikte</span>
            <button type="button" onClick={() => setService('debts')}>
              Sorgula
            </button>
          </li>
          <li>
            <strong>Emlak vergisi</strong>
            <span>{propertyOpen.length} açık emlak kaydı</span>
            <button type="button" onClick={() => setService('property')}>
              Sorgula
            </button>
          </li>
          <li>
            <strong>Su aboneliği</strong>
            <span>{waterOpen.length} açık su kaydı</span>
            <button type="button" onClick={() => setService('water')}>
              Sorgula
            </button>
          </li>
          <li>
            <strong>İlan / reklam</strong>
            <span>Bu demoda tahsilat uç noktası yok.</span>
            <button type="button" onClick={() => setService('ads')}>
              Bilgi
            </button>
          </li>
        </ol>
      ) : null}

      {service === 'ads' ? (
        <section className="tx-block">
          <p className="tx-kicker">İlan / reklam</p>
          <h2>Bu hizmet bağlı değil</h2>
          <p className="tx-muted">
            Sahte ödeme formu gösterilmez. İlan tahsilatı için resmi süreç oluşunca buraya bağlanır.
          </p>
          <div className="wallet-actions">
            <Link className="btn btn-ghost" to="/hizmet-rehberi">
              Hizmet rehberi
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => setService('menu')}>
              Vezneye dön
            </button>
          </div>
        </section>
      ) : null}

      {service === 'debts' || service === 'property' || service === 'water' ? (
        <section className="stack">
          <p className="tx-kicker">Borç sorgula</p>
          <h2>
            {service === 'property' ? 'Emlak vergisi' : service === 'water' ? 'Su borcu' : 'Açık borçlar'}
          </h2>
          {visible.length === 0 ? (
            <p className="tx-muted">Bu başlıkta açık borç yok.</p>
          ) : (
            <div className="choice-grid tx-choice">
              {visible.map((debt) => (
                <button
                  key={debt.id}
                  type="button"
                  className={selectedId === debt.id ? 'is-selected' : ''}
                  onClick={() => setSelectedId(debt.id)}
                >
                  <strong>
                    {TYPE_LABEL[debt.type] ?? debt.type} · {money(debt.totalPayable)}
                  </strong>
                  <span className="muted">
                    Vade {new Date(debt.dueDateUtc).toLocaleDateString('tr-TR')}
                    {debt.overdueInterest > 0 ? ` · gecikme ${money(debt.overdueInterest)}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selected ? (
            <div className="receipt">
              <p className="tx-muted">Bu işlem portföy/demo ortamıdır. Gerçek ödeme alınmamaktadır.</p>
              <p>
                Ödenecek: <strong>{money(selected.totalPayable)}</strong>
              </p>
              <CardPaymentForm submitLabel={`${money(selected.totalPayable)} öde (demo)`} busy={busy} onSubmit={pay} />
            </div>
          ) : null}

          <button type="button" className="btn btn-ghost" onClick={() => setService('menu')}>
            Vezneye dön
          </button>
        </section>
      ) : null}

      {service === 'result' && result ? (
        <section className="receipt" id="dekont">
          <p className="tx-kicker">İşlem sonucu</p>
          <h2>İşlem başarıyla tamamlandı</h2>
          <p>
            İşlem numarası: {receiptCode('topup', result.id)}
            <br />
            {result.title}
            <br />
            {new Date(result.at).toLocaleString('tr-TR')}
            <br />
            Tutar: {money(result.amount)}
          </p>
          <p className="tx-muted">Demo tahsilat. Gerçek banka hareketi yoktur.</p>
          <div className="wallet-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              Yazdır / PDF
            </button>
            <Link className="btn btn-ghost" to="/borclar">
              Borçlarım
            </Link>
            <Link className="btn btn-ghost" to="/panel">
              İşlemlerime git
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setService('menu')}>
              Yeni işlem
            </button>
          </div>
        </section>
      ) : null}

      <TransportContinue exclude="/vezne" />
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
