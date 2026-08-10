import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CardPaymentForm, type CardPaymentValues } from '../components/CardPaymentForm'
import {
  apiFetch,
  type BoardingRecord,
  type BusLine,
  type Paginated,
  type TransportCard,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

const TOP_UP_PRESETS = ['25', '50', '100', '200'] as const

const CARD_SUGGESTIONS = ['AK-34-1001', 'AK-34-1002', 'HADIMKOY-01', 'DURUSU-01'] as const

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function TransportContent() {
  const [cards, setCards] = useState<TransportCard[]>([])
  const [lines, setLines] = useState<BusLine[]>([])
  const [boardings, setBoardings] = useState<BoardingRecord[]>([])
  const [cardNumber, setCardNumber] = useState('AK-34-1001')
  const [lineQ, setLineQ] = useState('')
  const [selectedLineId, setSelectedLineId] = useState('')
  const [topUpCardId, setTopUpCardId] = useState<string | null>(null)
  const [topUpAmount, setTopUpAmount] = useState('50')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [boardingBusyId, setBoardingBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [myCards, busLines, boardingPage] = await Promise.all([
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
      apiFetch<BusLine[]>('/api/v1/bus-lines'),
      apiFetch<Paginated<BoardingRecord>>(
        '/api/v1/transport-cards/mine/boardings?pageSize=8',
        {},
        true,
      ),
    ])
    setCards(myCards)
    setLines(busLines.filter((l) => l.isActive))
    setBoardings(boardingPage.items)
    setSelectedLineId((current) =>
      current && busLines.some((l) => l.id === current) ? current : busLines[0]?.id || '',
    )
  }, [])

  useEffect(() => {
    setLoading(true)
    void load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Ulaşım verisi yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [load])

  const totals = useMemo(() => {
    const active = cards.filter((c) => c.isActive)
    return {
      cards: cards.length,
      active: active.length,
      balance: cards.reduce((sum, c) => sum + c.balance, 0),
      boardings: boardings.length,
    }
  }, [cards, boardings])

  const filteredLines = useMemo(() => {
    const needle = lineQ.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return lines
    return lines.filter((line) =>
      `${line.code} ${line.name} ${line.routeSummary}`.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [lines, lineQ])

  const lineMap = useMemo(() => new Map(lines.map((l) => [l.id, l])), [lines])
  const selectedLine = lines.find((l) => l.id === selectedLineId)

  async function issueCard(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await apiFetch(
        '/api/v1/transport-cards',
        {
          method: 'POST',
          body: JSON.stringify({ cardNumber: cardNumber.trim(), initialBalance: 50 }),
        },
        true,
      )
      setCardNumber('AK-34-1001')
      setMessage('Kart oluşturuldu (başlangıç bakiyesi ₺50).')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kart oluşturulamadı.')
    }
  }

  async function submitTopUp(_values: CardPaymentValues) {
    if (!topUpCardId) return
    const amount = Number(topUpAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Geçerli bir tutar girin.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(
        `/api/v1/transport-cards/${topUpCardId}/top-up`,
        {
          method: 'POST',
          body: JSON.stringify({ amount }),
        },
        true,
      )
      setMessage(`${money(amount)} yüklendi.`)
      setTopUpCardId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function board(cardId: string) {
    if (!selectedLineId) {
      setError('Önce bir hat seçin.')
      return
    }
    const card = cards.find((c) => c.id === cardId)
    const fare = selectedLine?.baseFare ?? 0
    if (card && card.balance < fare) {
      setError(
        `Yetersiz bakiye. Ücret ${money(fare)}, kart bakiyesi ${money(card.balance)}. Önce yükleme yapın.`,
      )
      return
    }

    setBoardingBusyId(cardId)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(
        `/api/v1/transport-cards/${cardId}/board`,
        {
          method: 'POST',
          body: JSON.stringify({ busLineId: selectedLineId }),
        },
        true,
      )
      setMessage(
        selectedLine
          ? `${selectedLine.code} hattına biniş kaydedildi (−${money(fare)}).`
          : 'Biniş kaydedildi.',
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biniş başarısız.')
    } finally {
      setBoardingBusyId(null)
    }
  }

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Ulaşım kartı</h1>
        <p className="muted">
          Kart çıkarın, bakiye yükleyin. Ağ hub: <Link to="/ulasim-agi">ulaşım ağı</Link> · adım adım{' '}
          <Link to="/binis">simülasyon</Link>.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="notice">{message}</div> : null}

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
        <div className="stats-strip" aria-label="Ulaşım özeti">
          <div>
            <span className="muted">Kart</span>
            <strong>{totals.cards}</strong>
          </div>
          <div>
            <span className="muted">Aktif</span>
            <strong>{totals.active}</strong>
          </div>
          <div>
            <span className="muted">Toplam bakiye</span>
            <strong>{money(totals.balance)}</strong>
          </div>
          <div>
            <span className="muted">Son biniş</span>
            <strong>{totals.boardings}</strong>
          </div>
        </div>
      )}

      {topUpCardId ? (
        <div className="panel stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Bakiye yükle</h3>
            <button type="button" className="btn btn-ghost" onClick={() => setTopUpCardId(null)}>
              Vazgeç
            </button>
          </div>
          <div className="dept-chip-row" role="group" aria-label="Hazır tutarlar">
            {TOP_UP_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                className={topUpAmount === amount ? 'is-active' : undefined}
                onClick={() => setTopUpAmount(amount)}
              >
                ₺{amount}
              </button>
            ))}
          </div>
          <CardPaymentForm
            submitLabel={`${money(Number(topUpAmount) || 0)} yükle`}
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
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  required
                />
              </div>
            }
          />
        </div>
      ) : null}

      <form id="yeni-kart" className="panel stack" onSubmit={(e) => void issueCard(e)}>
        <h3 style={{ margin: 0 }}>Yeni kart</h3>
        <div className="dept-chip-row" role="group" aria-label="Kart no önerileri">
          {CARD_SUGGESTIONS.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => setCardNumber(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="cardNumber">Kart numarası</label>
          <input
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="AK-34-1001"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Kart çıkar (₺50 başlangıç)
        </button>
      </form>

      <div className="panel stack">
        <h3 style={{ margin: 0 }}>Hızlı biniş hattı</h3>
        <p className="muted" style={{ margin: 0 }}>
          Tek tık biniş. Daha kontrollü akış için <Link to="/binis">biniş simülasyonu</Link>.
        </p>
        <div className="field">
          <label htmlFor="line-search">Hat ara</label>
          <input
            id="line-search"
            type="search"
            value={lineQ}
            onChange={(e) => setLineQ(e.target.value)}
            placeholder="Kod veya güzergâh…"
          />
        </div>
        <div className="field">
          <label htmlFor="line">Hat</label>
          <select
            id="line"
            value={selectedLineId}
            onChange={(e) => setSelectedLineId(e.target.value)}
          >
            {filteredLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.code} — {line.name} ({money(line.baseFare)})
              </option>
            ))}
          </select>
        </div>
        {selectedLine ? (
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            {selectedLine.routeSummary || 'Güzergâh özeti yok'} · Ücret {money(selectedLine.baseFare)}
          </p>
        ) : null}
      </div>

      <div className="stack">
        <div className="transit-card-grid">
          {cards.map((card, index) => {
            const canAfford = !selectedLine || card.balance >= selectedLine.baseFare
            const tone = index % 3
            return (
              <article
                key={card.id}
                className={`transit-card transit-card--tone-${tone}${card.isActive ? '' : ' is-inactive'}`}
              >
                <div className="transit-card-body">
                  <p className="transit-card-label">Ulaşım kartı</p>
                  <h3>{card.cardNumber}</h3>
                  <p className="transit-card-balance">{money(card.balance)}</p>
                  <span className={card.isActive ? 'badge badge-ok' : 'badge'}>
                    {card.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                  {selectedLine && !canAfford ? (
                    <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.82rem' }}>
                      Yetersiz bakiye ({money(selectedLine.baseFare)} gerekir)
                    </p>
                  ) : null}
                </div>
                <div className="transit-card-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setTopUpCardId(card.id)
                      setError(null)
                      setMessage(null)
                    }}
                  >
                    Bakiye yükle
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!card.isActive || boardingBusyId === card.id || !selectedLineId}
                    onClick={() => void board(card.id)}
                  >
                    {boardingBusyId === card.id ? 'Biniyor…' : 'Bin'}
                  </button>
                </div>
              </article>
            )
          })}
          <Link to="/ulasim#yeni-kart" className="transit-card transit-card--add">
            <strong>Yeni kart</strong>
            <span className="muted">Başlangıç bakiyesi ₺50</span>
          </Link>
        </div>
        {!loading && cards.length === 0 ? (
          <p className="muted">Henüz kartınız yok. Yukarıdaki önerilerden bir numarayla kart çıkarın.</p>
        ) : null}
      </div>

      <section className="panel stack">
        <h3 style={{ margin: 0 }}>Son binişler</h3>
        {boardings.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Henüz biniş yok. Hızlı biniş veya <Link to="/binis">simülasyon</Link> ile deneyin.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {boardings.map((boarding) => {
              const line = lineMap.get(boarding.busLineId)
              return (
                <li key={boarding.id}>
                  {new Date(boarding.boardedAtUtc).toLocaleString('tr-TR')}
                  {' · '}
                  {line ? `${line.code} ${line.name}` : 'Hat'}
                  {' · '}
                  {money(boarding.fareCharged)}
                </li>
              )
            })}
          </ul>
        )}
      </section>
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
