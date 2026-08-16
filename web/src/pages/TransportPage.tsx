import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CardPaymentForm, type CardPaymentValues } from '../components/CardPaymentForm'
import { TransportContinue, TransportNav } from '../components/transport/TransportChrome'
import {
  apiFetch,
  type BoardingRecord,
  type BusLine,
  type Paginated,
  type TransportCard,
} from '../lib/api'
import { parseLineSummary } from '../lib/busLineVisuals'
import { readPreferredCardId, writePreferredCardId } from '../lib/transportFavorites'
import { addReceipt, readReceipts, receiptCode, type TransportReceipt } from '../lib/transportReceipts'
import { RequireAuth } from './PanelPage'
import './bus-lines.css'
import './transport-wallet.css'

const TOP_UP_PRESETS = ['50', '100', '250', '500'] as const

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function maskNumber(value: string) {
  const compact = value.replace(/\s/g, '')
  if (compact.length <= 4) return compact
  return `**** **** **** ${compact.slice(-4)}`
}

type Step = 'list' | 'topup' | 'result'

function TransportContent() {
  const location = useLocation()
  const [cards, setCards] = useState<TransportCard[]>([])
  const [lines, setLines] = useState<BusLine[]>([])
  const [boardings, setBoardings] = useState<BoardingRecord[]>([])
  const [receipts, setReceipts] = useState<TransportReceipt[]>(() => readReceipts())
  const [cardNumber, setCardNumber] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('list')
  const [topUpAmount, setTopUpAmount] = useState('50')
  const [lastReceipt, setLastReceipt] = useState<TransportReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'board' | 'topup'>('all')
  const [showDetails, setShowDetails] = useState(false)

  const load = useCallback(async () => {
    const [myCards, busLines, boardingPage] = await Promise.all([
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
      apiFetch<BusLine[]>('/api/v1/bus-lines'),
      apiFetch<Paginated<BoardingRecord>>('/api/v1/transport-cards/mine/boardings?pageSize=20', {}, true),
    ])
    setCards(myCards)
    setLines(busLines.filter((line) => line.isActive))
    setBoardings(boardingPage.items)
    setSelectedId((current) => {
      const preferred = readPreferredCardId()
      if (current && myCards.some((card) => card.id === current)) return current
      if (preferred && myCards.some((card) => card.id === preferred)) return preferred
      return myCards[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    void load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Kartlar yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (location.hash === '#yukle' && selectedId) setStep('topup')
  }, [location.hash, selectedId])

  const selected = cards.find((card) => card.id === selectedId)
  const lineMap = useMemo(() => new Map(lines.map((line) => [line.id, line])), [lines])
  const lastBoard = boardings.find((item) => item.transportCardId === selectedId)

  const movements = useMemo(() => {
    const rows: { id: string; at: string; title: string; detail: string; amount: number; kind: 'board' | 'topup' }[] = []
    for (const boarding of boardings.filter((item) => !selectedId || item.transportCardId === selectedId)) {
      const line = lineMap.get(boarding.busLineId)
      const parsed = line ? parseLineSummary(line.routeSummary) : null
      rows.push({
        id: boarding.id,
        at: boarding.boardedAtUtc,
        title: line ? `${line.code} biniş` : 'Biniş',
        detail: parsed?.route ?? line?.name ?? 'Simülasyon ücreti',
        amount: -boarding.fareCharged,
        kind: 'board',
      })
    }
    for (const receipt of receipts.filter((item) => item.kind === 'topup' && (!selectedId || item.cardId === selectedId))) {
      rows.push({
        id: receipt.id,
        at: receipt.createdAtUtc,
        title: 'Bakiye yükleme (demo)',
        detail: receipt.cardNumber,
        amount: receipt.amount,
        kind: 'topup',
      })
    }
    return rows
      .filter((row) => filter === 'all' || row.kind === filter)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
  }, [boardings, receipts, lineMap, filter, selectedId])

  function exportCsv() {
    const header = 'Tarih;Tür;Açıklama;Tutar\n'
    const body = movements
      .map((row) =>
        [new Date(row.at).toLocaleString('tr-TR'), row.kind, `${row.title} ${row.detail}`, row.amount.toFixed(2)].join(
          ';',
        ),
      )
      .join('\n')
    const blob = new Blob([`\uFEFF${header}${body}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ulasim-hareketleri-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function issueCard(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const number = cardNumber.trim() || `AK-34-${String(Date.now()).slice(-4)}`
    try {
      await apiFetch(
        '/api/v1/transport-cards',
        { method: 'POST', body: JSON.stringify({ cardNumber: number, initialBalance: 50 }) },
        true,
      )
      setCardNumber('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kart oluşturulamadı.')
    }
  }

  async function submitTopUp(_values: CardPaymentValues) {
    if (!selected) return
    const amount = Number(topUpAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await apiFetch(
        `/api/v1/transport-cards/${selected.id}/top-up`,
        { method: 'POST', body: JSON.stringify({ amount }) },
        true,
      )
      const receipt: TransportReceipt = {
        id: crypto.randomUUID(),
        kind: 'topup',
        createdAtUtc: new Date().toISOString(),
        amount,
        cardId: selected.id,
        cardNumber: selected.cardNumber,
        note: 'Demo yükleme — gerçek tahsilat yok.',
      }
      addReceipt(receipt)
      setReceipts(readReceipts())
      setLastReceipt(receipt)
      setStep('result')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function reportLost() {
    if (!selected) return
    if (!window.confirm(`${selected.cardNumber} kartını pasife almak istiyor musunuz? Bu işlem geri alınamaz.`)) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await apiFetch(`/api/v1/transport-cards/${selected.id}/deactivate`, { method: 'POST' }, true)
      setInfo('Kart pasife alındı. Biniş ve yükleme bu kartta durur.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kart pasife alınamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page wallet">
      <TransportNav />
      <header>
        <p className="tx-kicker">Kartlarım</p>
        <h1>Arnavutköy ulaşım kartı</h1>
        <p className="tx-muted">
          Demo bakiye ve biniş kaydı. İstanbulkart tarife tutarı değildir. Gerçek ödeme alınmaz.
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
      {info ? <div className="notice">{info}</div> : null}
      {loading ? <p className="tx-muted">Kartlar yükleniyor…</p> : null}

      {step === 'result' && lastReceipt ? (
        <section className="receipt" id="dekont">
          <p className="tx-kicker">İşlem sonucu</p>
          <h2>Yükleme tamamlandı (demo)</h2>
          <p>
            İşlem no: {receiptCode('topup', lastReceipt.id)}
            <br />
            Tutar: {money(lastReceipt.amount)}
            <br />
            {new Date(lastReceipt.createdAtUtc).toLocaleString('tr-TR')}
          </p>
          <div className="wallet-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              Yazdır / PDF
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep('list')}>
              Kartlarıma dön
            </button>
          </div>
        </section>
      ) : null}

      {step === 'topup' && selected ? (
        <section className="tx-block">
          <p className="tx-kicker">Bakiye yükle</p>
          <h2>{selected.cardNumber}</h2>
          <p className="tx-muted">Bu işlem portföy/demo ortamıdır. Gerçek ödeme alınmamaktadır.</p>
          <div className="tx-chips" role="group" aria-label="Hazır tutarlar">
            {TOP_UP_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                className={topUpAmount === amount ? 'is-on' : ''}
                onClick={() => setTopUpAmount(amount)}
              >
                ₺{amount}
              </button>
            ))}
          </div>
          <CardPaymentForm
            submitLabel={`${money(Number(topUpAmount) || 0)} yükle (demo)`}
            busy={busy}
            onSubmit={submitTopUp}
            extraFields={
              <div className="field">
                <label htmlFor="topUpAmount">Tutar (₺)</label>
                <input
                  id="topUpAmount"
                  type="number"
                  min={1}
                  step={1}
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                  required
                />
              </div>
            }
          />
          <button type="button" className="btn btn-ghost" onClick={() => setStep('list')}>
            Vazgeç
          </button>
        </section>
      ) : null}

      {step === 'list' ? (
        <div className="wallet-grid">
          <div className="stack">
            {selected ? (
              <article className="plastic" aria-label="Seçili kart">
                <p>Arnavutköy ulaşım kartı</p>
                <strong>{maskNumber(selected.cardNumber)}</strong>
                <em>{money(selected.balance)}</em>
                <div className="plastic-meta">
                  <span>{selected.isActive ? 'Aktif' : 'Pasif'}</span>
                  <span>
                    Son biniş:{' '}
                    {lastBoard ? new Date(lastBoard.boardedAtUtc).toLocaleString('tr-TR') : 'kayıt yok'}
                  </span>
                </div>
              </article>
            ) : (
              <p className="tx-muted">Henüz kartınız yok. Numara vererek kart çıkarın.</p>
            )}

            {selected ? (
              <div className="wallet-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selected.isActive}
                  onClick={() => setStep('topup')}
                >
                  Bakiye yükle
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    writePreferredCardId(selected.id)
                    setInfo('Bu kart biniş ve yüklemede varsayılan olarak kaydedildi.')
                  }}
                >
                  Kartı kaydet
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowDetails((open) => !open)}>
                  Kart detayları
                </button>
                <Link className="btn btn-ghost" to="/binis">
                  Biniş
                </Link>
                <button type="button" className="btn btn-ghost" disabled={!selected.isActive || busy} onClick={() => void reportLost()}>
                  Kart kayboldu
                </button>
              </div>
            ) : null}

            {showDetails && selected ? (
              <dl className="tx-facts">
                <div>
                  <dt>Kart no</dt>
                  <dd>{selected.cardNumber}</dd>
                </div>
                <div>
                  <dt>Durum</dt>
                  <dd>{selected.isActive ? 'Aktif' : 'Pasif'}</dd>
                </div>
                <div>
                  <dt>Bakiye</dt>
                  <dd>{money(selected.balance)}</dd>
                </div>
                <div>
                  <dt>Kayıt</dt>
                  <dd>Demo ulaşım kartı — İstanbulkart değildir</dd>
                </div>
              </dl>
            ) : null}

            {cards.length > 1 ? (
              <div className="tx-chips" role="listbox" aria-label="Kart seç">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={card.id === selectedId ? 'is-on' : ''}
                    onClick={() => setSelectedId(card.id)}
                  >
                    {card.cardNumber}
                  </button>
                ))}
              </div>
            ) : null}

            <form className="stack" onSubmit={(event) => void issueCard(event)}>
              <label htmlFor="new-card">Yeni kart numarası</label>
              <input
                id="new-card"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                placeholder="Boş bırakırsanız numara üretilir"
              />
              <button className="btn btn-ghost" type="submit">
                Kart çıkar (₺50 demo)
              </button>
            </form>
          </div>

          <section>
            <p className="tx-kicker">Hareketler</p>
            <h2>Kart hareketleri</h2>
            <div className="tx-chips" role="toolbar" aria-label="İşlem tipi">
              <button type="button" className={filter === 'all' ? 'is-on' : ''} onClick={() => setFilter('all')}>
                Tümü
              </button>
              <button type="button" className={filter === 'board' ? 'is-on' : ''} onClick={() => setFilter('board')}>
                Biniş
              </button>
              <button type="button" className={filter === 'topup' ? 'is-on' : ''} onClick={() => setFilter('topup')}>
                Yükleme
              </button>
              {movements.length > 0 ? (
                <button type="button" onClick={exportCsv}>
                  CSV indir
                </button>
              ) : null}
            </div>
            {movements.length === 0 ? (
              <p className="tx-muted">Henüz hareket yok. Yükleme bu tarayıcıda, biniş API kaydındadır.</p>
            ) : (
              <ul className="ledger">
                {movements.map((row) => (
                  <li key={row.id}>
                    <strong>{row.title}</strong>
                    <b>{row.amount > 0 ? `+ ${money(row.amount)}` : money(row.amount)}</b>
                    <span>{row.detail}</span>
                    <em>{new Date(row.at).toLocaleString('tr-TR')}</em>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <TransportContinue exclude="/ulasim" />
    </div>
  )
}

export function TransportPage() {
  return (
    <RequireAuth>
      <TransportContent />
    </RequireAuth>
  )
}
