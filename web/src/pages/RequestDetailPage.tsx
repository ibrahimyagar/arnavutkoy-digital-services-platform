import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { RequestStatusTimeline } from '../components/RequestStatusTimeline'
import { apiFetch, type RequestCategory } from '../lib/api'
import { isStaff } from '../lib/roles'
import {
  requestStatusBadgeClass,
  requestStatusLabel,
} from '../lib/requestStatus'
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
  const navigate = useNavigate()
  const { user } = useAuth()
  const staff = isStaff(user?.roles)
  const [detail, setDetail] = useState<CitizenRequestDetail | null>(null)
  const [categories, setCategories] = useState<RequestCategory[]>([])
  const [reply, setReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    const [data, cats] = await Promise.all([
      apiFetch<CitizenRequestDetail>(`/api/v1/citizen-requests/${id}`, {}, true),
      apiFetch<RequestCategory[]>('/api/v1/citizen-requests/categories'),
    ])
    setDetail(data)
    setCategories(cats)
  }, [id])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Talep yüklenemedi.')
    })
  }, [load])

  async function onReply(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setBusy(true)
    setError(null)
    setInfo(null)
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
      setInfo('Mesaj gönderildi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function runStatus(path: string, okMessage: string) {
    if (!id) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await apiFetch(path, { method: 'POST' }, true)
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi.')
    } finally {
      setBusy(false)
    }
  }

  const categoryName =
    categories.find((c) => c.id === detail?.categoryId)?.name ?? 'Kategori'
  const backTo = staff ? '/personel' : '/talepler'
  const backLabel = staff ? '← Personel masası' : '← Taleplerim'

  function senderLabel(senderType: string) {
    if (staff) {
      return senderType === 'Officer' ? 'Siz (belediye)' : 'Vatandaş'
    }
    return senderType === 'Officer' ? 'Belediye' : 'Siz'
  }

  return (
    <div className="container stack">
      <p className="muted">
        <Link to={backTo}>{backLabel}</Link>
      </p>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      {detail ? (
        <>
          <div className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p className="muted" style={{ margin: '0 0 0.35rem' }}>
                  {categoryName}
                </p>
                <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.8rem' }}>
                  Talep #{detail.id.slice(0, 8)}
                </h1>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Oluşturulma: {new Date(detail.createdAtUtc).toLocaleString('tr-TR')}
                  {detail.resolvedAtUtc
                    ? ` · Çözüm: ${new Date(detail.resolvedAtUtc).toLocaleString('tr-TR')}`
                    : ''}
                </p>
              </div>
              <span className={requestStatusBadgeClass(detail.status)}>
                {requestStatusLabel(detail.status)}
              </span>
            </div>

            <RequestStatusTimeline status={detail.status} />

            {staff ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {detail.status === 'Pending' ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() =>
                      void runStatus(
                        `/api/v1/citizen-requests/${detail.id}/under-review`,
                        'İncelemeye alındı.',
                      )
                    }
                  >
                    İncelemeye al
                  </button>
                ) : null}
                {detail.status === 'Pending' || detail.status === 'UnderReview' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() =>
                      void runStatus(
                        `/api/v1/citizen-requests/${detail.id}/resolve`,
                        'Talep çözüldü.',
                      )
                    }
                  >
                    Çöz
                  </button>
                ) : null}
                {detail.status !== 'Closed' ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() =>
                      void runStatus(
                        `/api/v1/citizen-requests/${detail.id}/close`,
                        'Talep kapatıldı.',
                      )
                    }
                  >
                    Kapat
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <section className="stack" aria-label="Mesajlaşma">
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.25rem' }}>
              Yazışma
            </h2>
            <div className="message-thread">
              {detail.messages.map((msg) => {
                const mine =
                  (staff && msg.senderType === 'Officer') ||
                  (!staff && msg.senderType === 'Citizen')
                return (
                  <article
                    key={msg.id}
                    className={`message-bubble ${mine ? 'is-mine' : 'is-theirs'}`}
                  >
                    <div className="message-meta">
                      <strong>{senderLabel(msg.senderType)}</strong>
                      <time dateTime={msg.sentAtUtc}>
                        {new Date(msg.sentAtUtc).toLocaleString('tr-TR')}
                      </time>
                    </div>
                    <p>{msg.message}</p>
                  </article>
                )
              })}
            </div>
          </section>

          {detail.status !== 'Closed' ? (
            <form className="panel stack" onSubmit={(e) => void onReply(e)}>
              <h3>{staff ? 'Vatandaşa yanıt yaz' : 'Yanıt yaz'}</h3>
              <div className="field">
                <label htmlFor="reply">Mesaj</label>
                <textarea
                  id="reply"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  required
                  maxLength={2000}
                  placeholder={
                    staff
                      ? 'İnceleme sonucu veya ek bilgi talep edin…'
                      : 'Ek bilgi veya güncelleme yazın…'
                  }
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
      ) : !error ? (
        <p className="muted">Yükleniyor…</p>
      ) : (
        <button type="button" className="btn btn-ghost" onClick={() => navigate(backTo)}>
          Geri dön
        </button>
      )}
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
