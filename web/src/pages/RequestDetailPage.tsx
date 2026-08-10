import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { RequireAuth } from './PanelPage'

type RequestMessage = {
  id: string
  senderType: string
  message: string
  sentAtUtc: string
}

type CitizenRequestDetail = {
  id: string
  citizenUserId: string
  categoryId: string
  status: string
  createdAtUtc: string
  resolvedAtUtc: string | null
  messages: RequestMessage[]
}

function RequestDetailContent() {
  const { id } = useParams()
  const [detail, setDetail] = useState<CitizenRequestDetail | null>(null)
  const [reply, setReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!id) return
    const data = await apiFetch<CitizenRequestDetail>(`/api/v1/citizen-requests/${id}`, {}, true)
    setDetail(data)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Talep yüklenemedi.')
    })
  }, [id])

  async function onReply(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      await apiFetch(
        `/api/v1/citizen-requests/${id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ message: reply }),
        },
        true,
      )
      setReply('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack">
      <p className="muted">
        <Link to="/talepler">← Taleplerim</Link>
      </p>

      {error ? <div className="error-box">{error}</div> : null}

      {detail ? (
        <>
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.8rem' }}>
                  Talep #{detail.id.slice(0, 8)}
                </h1>
                <p className="muted">{new Date(detail.createdAtUtc).toLocaleString('tr-TR')}</p>
              </div>
              <span className="badge">{detail.status}</span>
            </div>
          </div>

          <div className="stack">
            {detail.messages.map((msg) => (
              <article key={msg.id} className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <strong>{msg.senderType === 'Officer' ? 'Belediye' : 'Siz'}</strong>
                  <span className="muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(msg.sentAtUtc).toLocaleString('tr-TR')}
                  </span>
                </div>
                <p style={{ margin: 0 }}>{msg.message}</p>
              </article>
            ))}
          </div>

          {detail.status !== 'Closed' ? (
            <form className="panel stack" onSubmit={(e) => void onReply(e)}>
              <h3>Yanıt yaz</h3>
              <div className="field">
                <label htmlFor="reply">Mesaj</label>
                <textarea
                  id="reply"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  required
                  maxLength={2000}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </form>
          ) : (
            <div className="notice">Bu talep kapatılmış; yeni mesaj eklenemez.</div>
          )}
        </>
      ) : null}
    </div>
  )
}

export function RequestDetailPage() {
  return (
    <RequireAuth>
      <RequestDetailContent />
    </RequireAuth>
  )
}
