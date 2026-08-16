import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TransportContinue, TransportNav } from '../components/transport/TransportChrome'
import {
  apiFetch,
  type BoardingRecord,
  type BusLine,
  type BusLineDetails,
  type Paginated,
  type TransportCard,
} from '../lib/api'
import { parseLineSummary, searchLine, sortedStops } from '../lib/busLineVisuals'
import { addReceipt, receiptCode } from '../lib/transportReceipts'
import { RequireAuth } from './PanelPage'
import './bus-lines.css'
import './transport-wallet.css'

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function BoardingContent() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [lines, setLines] = useState<BusLine[]>([])
  const [cards, setCards] = useState<TransportCard[]>([])
  const [boardings, setBoardings] = useState<BoardingRecord[]>([])
  const [detail, setDetail] = useState<BusLineDetails | null>(null)
  const [lineId, setLineId] = useState('')
  const [cardId, setCardId] = useState('')
  const [stopName, setStopName] = useState('')
  const [lineQ, setLineQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [resultId, setResultId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [busLines, myCards, boardingPage] = await Promise.all([
      apiFetch<BusLine[]>('/api/v1/bus-lines'),
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
      apiFetch<Paginated<BoardingRecord>>('/api/v1/transport-cards/mine/boardings?pageSize=8', {}, true),
    ])
    const active = busLines.filter((line) => line.isActive)
    setLines(active)
    setCards(myCards)
    setBoardings(boardingPage.items)
    setLineId((current) => (current && active.some((line) => line.id === current) ? current : active[0]?.id || ''))
    setCardId((current) => (current && myCards.some((card) => card.id === current) ? current : myCards[0]?.id || ''))
  }

  useEffect(() => {
    setLoading(true)
    void refresh()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Veri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!lineId) {
      setDetail(null)
      return
    }
    let cancelled = false
    void apiFetch<BusLineDetails>(`/api/v1/bus-lines/${lineId}`)
      .then((item) => {
        if (cancelled) return
        setDetail(item)
        const stops = sortedStops(item.stops)
        setStopName((current) => (stops.some((stop) => stop.name === current) ? current : stops[0]?.name ?? ''))
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [lineId])

  const selectedLine = lines.find((line) => line.id === lineId)
  const selectedCard = cards.find((card) => card.id === cardId)
  const stops = detail ? sortedStops(detail.stops) : []
  const canAfford = selectedLine && selectedCard ? selectedCard.balance >= selectedLine.baseFare : false
  const filteredLines = useMemo(() => {
    const needle = lineQ.trim().toLocaleLowerCase('tr-TR')
    return lines.filter((line) => searchLine(line, needle))
  }, [lines, lineQ])

  async function confirmBoard() {
    if (!lineId || !cardId || !selectedLine || !selectedCard) return
    if (!canAfford) {
      setError(`Yetersiz bakiye. Simülasyon ücreti ${money(selectedLine.baseFare)}.`)
      return
    }
    setBusy(true)
    setScanning(true)
    setError(null)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      const created = await apiFetch<{ id: string }>(
        `/api/v1/transport-cards/${cardId}/board`,
        { method: 'POST', body: JSON.stringify({ busLineId: lineId }) },
        true,
      )
      const boardingId = created.id
      addReceipt({
        id: crypto.randomUUID(),
        kind: 'board',
        createdAtUtc: new Date().toISOString(),
        amount: selectedLine.baseFare,
        cardId: selectedCard.id,
        cardNumber: selectedCard.cardNumber,
        lineCode: selectedLine.code,
        lineName: selectedLine.name,
        stopName,
        boardingId,
        note: 'Simülasyon binişi — İETT tarife değildir.',
      })
      setResultId(boardingId)
      setStep(4)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biniş başarısız.')
      setScanning(false)
    } finally {
      setBusy(false)
      setScanning(false)
    }
  }

  const parsed = selectedLine ? parseLineSummary(selectedLine.routeSummary) : null

  return (
    <div className="container page wallet">
      <TransportNav />
      <header>
        <p className="tx-kicker">Biniş simülasyonu</p>
        <h1>Kartı okutun, kaydı görün.</h1>
        <p className="tx-muted">
          Düşülen tutar demo biniş ücretidir; güncel İstanbulkart tarifesi değildir. Durak seçimi yalnızca
          güzergâh uçlarındandır.
        </p>
      </header>

      <ol className="wizard-steps" aria-label="Adımlar">
        <li className={step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}>Hat</li>
        <li className={step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}>Durak ucu</li>
        <li className={step === 3 ? 'is-active' : step > 3 ? 'is-done' : ''}>Kart</li>
        <li className={step === 4 ? 'is-active' : ''}>Sonuç</li>
      </ol>

      {error ? (
        <div className="error-box">
          {error}{' '}
          <button type="button" className="btn btn-ghost" onClick={() => void refresh()}>
            Tekrar dene
          </button>
        </div>
      ) : null}
      {loading ? <p className="tx-muted">Veriler yükleniyor…</p> : null}

      {step === 1 ? (
        <section className="stack">
          <label htmlFor="sim-q">Hat ara</label>
          <input id="sim-q" value={lineQ} onChange={(event) => setLineQ(event.target.value)} placeholder="336, Hadımköy…" />
          <div className="choice-grid tx-choice">
            {filteredLines.map((line) => {
              const route = parseLineSummary(line.routeSummary).route
              return (
                <button
                  key={line.id}
                  type="button"
                  className={lineId === line.id ? 'is-selected' : ''}
                  onClick={() => setLineId(line.id)}
                >
                  <strong>
                    {line.code} — {line.name}
                  </strong>
                  <span className="muted">{route || line.name}</span>
                </button>
              )
            })}
          </div>
          {filteredLines.length === 0 ? (
            <p className="tx-muted">
              Hat yok. <Link to="/hatlar">Kataloga</Link> bakın.
            </p>
          ) : null}
          <button className="btn btn-primary" type="button" disabled={!lineId} onClick={() => setStep(2)}>
            Durak ucunu seç
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="stack">
          <h2>Biniş noktası</h2>
          <p className="tx-muted">Tam durak listesi yok. Yalnızca resmi hat adındaki uçlar.</p>
          <div className="choice-grid tx-choice">
            {stops.map((stop) => (
              <button
                key={stop.id}
                type="button"
                className={stopName === stop.name ? 'is-selected' : ''}
                onClick={() => setStopName(stop.name)}
              >
                <strong>{stop.name}</strong>
                <span className="muted">{stop.sequence === 1 ? 'Başlangıç' : 'Güzergâh ucu'}</span>
              </button>
            ))}
          </div>
          {stops.length === 0 ? <p className="tx-muted">Bu hat için uç kaydı yok.</p> : null}
          <div className="wallet-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setStep(1)}>
              Geri
            </button>
            <button className="btn btn-primary" type="button" disabled={!stopName} onClick={() => setStep(3)}>
              Kart seç
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="stack">
          <h2>Kart ve onay</h2>
          {cards.length === 0 ? (
            <p className="tx-muted">
              Kartınız yok. <Link to="/ulasim">Kart çıkarın</Link>.
            </p>
          ) : (
            <div className="choice-grid tx-choice">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={cardId === card.id ? 'is-selected' : ''}
                  disabled={!card.isActive}
                  onClick={() => setCardId(card.id)}
                >
                  <strong>{card.cardNumber}</strong>
                  <span className="muted">
                    {money(card.balance)}
                    {!card.isActive ? ' · pasif' : ''}
                    {selectedLine && card.balance < selectedLine.baseFare ? ' · yetersiz' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          <p>
            {selectedLine?.code} · {stopName || 'uç seçilmedi'} · simülasyon {selectedLine ? money(selectedLine.baseFare) : '—'}
          </p>
          {!canAfford && selectedLine ? (
            <div className="notice">
              Yetersiz bakiye. <Link to="/ulasim#yukle">Bakiye yükleyin</Link>.
            </div>
          ) : null}
          {scanning ? <div className="scan">Kart okunuyor…</div> : null}
          <div className="wallet-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setStep(2)}>
              Geri
            </button>
            <button className="btn btn-primary" type="button" disabled={busy || !canAfford} onClick={() => void confirmBoard()}>
              {busy ? 'İşleniyor…' : 'Kartı okut'}
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 && selectedLine && selectedCard && resultId ? (
        <section className="receipt">
          <div className="scan is-ok">Biniş onaylandı</div>
          <p className="tx-kicker">İşlem sonucu</p>
          <h2>
            {selectedLine.code} · {parsed?.route}
          </h2>
          <p>
            Durak ucu: {stopName}
            <br />
            Simülasyon ücreti: {money(selectedLine.baseFare)}
            <br />
            Kalan bakiye: {money(selectedCard.balance)}
            <br />
            İşlem no: {receiptCode('board', resultId)}
          </p>
          <p className="tx-muted">Bu tutar İETT tarifesi değildir. Kayıt kart hareketlerine düşer.</p>
          <div className="wallet-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              Yazdır / PDF
            </button>
            <Link className="btn btn-ghost" to="/ulasim">
              Kart hareketleri
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setStep(1)
                setResultId(null)
              }}
            >
              Yeni biniş
            </button>
          </div>
        </section>
      ) : null}

      {!loading && boardings.length > 0 && step !== 4 ? (
        <p className="tx-muted">{boardings.length} son biniş kaydı kart hareketlerinde.</p>
      ) : null}

      <TransportContinue exclude="/binis" />
    </div>
  )
}

export function BoardingSimulatorPage() {
  return (
    <RequireAuth>
      <BoardingContent />
    </RequireAuth>
  )
}
