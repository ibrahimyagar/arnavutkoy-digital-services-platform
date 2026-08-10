import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  apiFetch,
  type BoardingRecord,
  type BusLine,
  type Paginated,
  type TransportCard,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function BoardingContent() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [lines, setLines] = useState<BusLine[]>([])
  const [cards, setCards] = useState<TransportCard[]>([])
  const [boardings, setBoardings] = useState<BoardingRecord[]>([])
  const [lineId, setLineId] = useState('')
  const [cardId, setCardId] = useState('')
  const [lineQ, setLineQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [busLines, myCards, boardingPage] = await Promise.all([
      apiFetch<BusLine[]>('/api/v1/bus-lines'),
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
      apiFetch<Paginated<BoardingRecord>>(
        '/api/v1/transport-cards/mine/boardings?pageSize=5',
        {},
        true,
      ),
    ])
    const activeLines = busLines.filter((l) => l.isActive)
    setLines(activeLines)
    setCards(myCards)
    setBoardings(boardingPage.items)
    setLineId((current) =>
      current && activeLines.some((l) => l.id === current) ? current : activeLines[0]?.id || '',
    )
    setCardId((current) =>
      current && myCards.some((c) => c.id === current) ? current : myCards[0]?.id || '',
    )
  }

  useEffect(() => {
    setLoading(true)
    void refresh()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Veri yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  const selectedLine = lines.find((l) => l.id === lineId)
  const selectedCard = cards.find((c) => c.id === cardId)
  const lineMap = useMemo(() => new Map(lines.map((l) => [l.id, l])), [lines])

  const filteredLines = useMemo(() => {
    const needle = lineQ.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return lines
    return lines.filter((line) =>
      `${line.code} ${line.name} ${line.routeSummary}`.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [lines, lineQ])

  const balanceAfter =
    selectedLine && selectedCard ? selectedCard.balance - selectedLine.baseFare : null
  const canAfford =
    selectedLine && selectedCard ? selectedCard.balance >= selectedLine.baseFare : false

  async function confirmBoard() {
    if (!lineId || !cardId || !selectedLine || !selectedCard) return
    if (!canAfford) {
      setError(
        `Yetersiz bakiye. Ücret ${money(selectedLine.baseFare)}, kart ${money(selectedCard.balance)}.`,
      )
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(
        `/api/v1/transport-cards/${cardId}/board`,
        {
          method: 'POST',
          body: JSON.stringify({ busLineId: lineId }),
        },
        true,
      )
      setMessage(
        `${selectedLine.code} binişi tamam · −${money(selectedLine.baseFare)}. Yeni bakiye panele yansır.`,
      )
      await refresh()
      setStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biniş başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Biniş simülasyonu</h1>
        <p className="muted">
          Hat seç → kart seç → bin. Kart / yükleme için <Link to="/ulasim">ulaşım</Link>, ödeme hub:{' '}
          <Link to="/vezne">vezne</Link>.
        </p>
      </div>

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
        <div className="stats-strip" aria-label="Simülasyon özeti">
          <div>
            <span className="muted">Hat</span>
            <strong>{lines.length}</strong>
          </div>
          <div>
            <span className="muted">Kart</span>
            <strong>{cards.length}</strong>
          </div>
          <div>
            <span className="muted">Seçili ücret</span>
            <strong>{selectedLine ? money(selectedLine.baseFare) : '—'}</strong>
          </div>
          <div>
            <span className="muted">Son biniş</span>
            <strong>{boardings.length}</strong>
          </div>
        </div>
      )}

      <ol className="wizard-steps" aria-label="Adımlar">
        <li className={step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}>1. Hat</li>
        <li className={step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}>2. Kart</li>
        <li className={step === 3 ? 'is-active' : ''}>3. Onay</li>
      </ol>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="notice">{message}</div> : null}

      {step === 1 ? (
        <div className="stack">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Hat seçin</h2>
          <div className="field">
            <label htmlFor="sim-line-search">Ara</label>
            <input
              id="sim-line-search"
              type="search"
              value={lineQ}
              onChange={(e) => setLineQ(e.target.value)}
              placeholder="Hadımköy, Durusu…"
            />
          </div>
          {filteredLines.length === 0 ? (
            <p className="muted">
              Hat yok. <Link to="/hatlar">Hat listesine</Link> bakın.
            </p>
          ) : (
            <div className="choice-grid">
              {filteredLines.map((line) => (
                <button
                  key={line.id}
                  type="button"
                  className={`choice-card ${lineId === line.id ? 'is-selected' : ''}`}
                  onClick={() => setLineId(line.id)}
                >
                  <strong>
                    {line.code} — {line.name}
                  </strong>
                  <span className="muted">
                    Ücret: {money(line.baseFare)}
                    {line.routeSummary ? ` · ${line.routeSummary}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          <button
            className="btn btn-primary"
            type="button"
            disabled={!lineId}
            onClick={() => setStep(2)}
          >
            Devam
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="stack">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Kart seçin</h2>
          {cards.length === 0 ? (
            <p className="muted">
              Kartınız yok. Önce <Link to="/ulasim">ulaşım</Link> sayfasından kart oluşturun.
            </p>
          ) : (
            <div className="choice-grid">
              {cards.map((card) => {
                const enough = !selectedLine || card.balance >= selectedLine.baseFare
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`choice-card ${cardId === card.id ? 'is-selected' : ''}`}
                    onClick={() => setCardId(card.id)}
                    disabled={!card.isActive}
                  >
                    <strong>{card.cardNumber}</strong>
                    <span className="muted">
                      Bakiye: {money(card.balance)}
                      {!enough ? ' · yetersiz' : ''}
                      {!card.isActive ? ' · pasif' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" type="button" onClick={() => setStep(1)}>
              Geri
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={!cardId}
              onClick={() => setStep(3)}
            >
              Devam
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="stack">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Onay</h2>
          <div className="panel stack">
            <p style={{ margin: 0 }}>
              <strong>Hat:</strong>{' '}
              {selectedLine ? `${selectedLine.code} — ${selectedLine.name}` : '—'} (
              {selectedLine ? money(selectedLine.baseFare) : '—'})
            </p>
            <p style={{ margin: 0 }}>
              <strong>Kart:</strong> {selectedCard?.cardNumber ?? '—'} (bakiye{' '}
              {selectedCard ? money(selectedCard.balance) : '—'})
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Biniş sonrası tahmini bakiye:{' '}
              {balanceAfter === null
                ? '—'
                : canAfford
                  ? money(balanceAfter)
                  : 'yetersiz — önce yükleme yapın'}
            </p>
          </div>
          {!canAfford ? (
            <div className="notice">
              Bakiye yetersiz. <Link to="/ulasim">Ulaşım</Link> sayfasından yükleme yapın.
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" type="button" onClick={() => setStep(2)}>
              Geri
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy || !canAfford}
              onClick={() => void confirmBoard()}
            >
              {busy ? 'İşleniyor…' : 'Bin'}
            </button>
          </div>
        </div>
      ) : null}

      {!loading && boardings.length > 0 ? (
        <section className="panel stack">
          <h3 style={{ margin: 0 }}>Son binişler</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {boardings.map((boarding) => {
              const line = lineMap.get(boarding.busLineId)
              return (
                <li key={boarding.id}>
                  {new Date(boarding.boardedAtUtc).toLocaleString('tr-TR')} ·{' '}
                  {line ? `${line.code} ${line.name}` : 'Hat'} · {money(boarding.fareCharged)}
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
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
