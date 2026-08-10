import { useEffect, useState, type FormEvent } from 'react'
import {
  apiFetch,
  type BusLine,
  type TransportCard,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

function TransportContent() {
  const [cards, setCards] = useState<TransportCard[]>([])
  const [lines, setLines] = useState<BusLine[]>([])
  const [cardNumber, setCardNumber] = useState('')
  const [selectedLineId, setSelectedLineId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const [myCards, busLines] = await Promise.all([
      apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
      apiFetch<BusLine[]>('/api/v1/bus-lines'),
    ])
    setCards(myCards)
    setLines(busLines)
    if (!selectedLineId && busLines[0]) setSelectedLineId(busLines[0].id)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Ulaşım verisi yüklenemedi.')
    })
  }, [])

  async function issueCard(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      await apiFetch('/api/v1/transport-cards', {
        method: 'POST',
        body: JSON.stringify({ cardNumber, initialBalance: 50 }),
      }, true)
      setCardNumber('')
      setMessage('Kart oluşturuldu (başlangıç bakiyesi ₺50).')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kart oluşturulamadı.')
    }
  }

  async function topUp(cardId: string) {
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`/api/v1/transport-cards/${cardId}/top-up`, {
        method: 'POST',
        body: JSON.stringify({ amount: 25 }),
      }, true)
      setMessage('₺25 yüklendi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız.')
    }
  }

  async function board(cardId: string) {
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`/api/v1/transport-cards/${cardId}/board`, {
        method: 'POST',
        body: JSON.stringify({ busLineId: selectedLineId }),
      }, true)
      setMessage('Biniş kaydedildi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biniş başarısız.')
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Ulaşım kartı</h1>
        <p className="muted">Kart çıkarın, bakiye yükleyin, hatlara binin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {message ? <div className="notice">{message}</div> : null}

      <form className="panel stack" onSubmit={(e) => void issueCard(e)}>
        <h3>Yeni kart</h3>
        <div className="field">
          <label htmlFor="cardNumber">Kart numarası</label>
          <input
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="TK-DEMO-001"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Kart çıkar
        </button>
      </form>

      <div className="panel stack">
        <h3>Biniş hattı</h3>
        <div className="field">
          <label htmlFor="line">Hat</label>
          <select
            id="line"
            value={selectedLineId}
            onChange={(e) => setSelectedLineId(e.target.value)}
          >
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.code} — {line.name} (₺{line.baseFare.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="stack">
        {cards.map((card) => (
          <article key={card.id} className="panel" style={{ display: 'grid', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{card.cardNumber}</h3>
                <p className="muted">Bakiye: ₺{card.balance.toFixed(2)}</p>
              </div>
              <span className={card.isActive ? 'badge badge-ok' : 'badge'}>
                {card.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost" onClick={() => void topUp(card.id)}>
                +₺25 yükle
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void board(card.id)}>
                Bin
              </button>
            </div>
          </article>
        ))}
        {cards.length === 0 ? <p className="muted">Henüz kartınız yok.</p> : null}
      </div>
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
