import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { RequestStatusTimeline } from '../components/RequestStatusTimeline'
import { BusyButton } from '../components/ui/BusyButton'
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

const STAFF_REPLY_TEMPLATES = [
  {
    id: 'ack',
    label: 'Alındı',
    text: 'Talebiniz alındı. İlgili birim incelemesine yönlendirildi; süreç hakkında bu kanaldan bilgilendirileceksiniz.',
  },
  {
    id: 'info',
    label: 'Ek bilgi',
    text: 'İncelemeyi tamamlayabilmemiz için mahalle, sokak/yakın nokta ve mümkünse fotoğraf veya net konum bilgisini paylaşır mısınız?',
  },
  {
    id: 'schedule',
    label: 'Saha planı',
    text: 'Saha ekibi planlamaya alındı. Arnavutköy sınırları içinde uygun çalışma penceresinde yerinde kontrol yapılacaktır.',
  },
  {
    id: 'resolved',
    label: 'Çözüldü',
    text: 'Talebinizle ilgili işlem tamamlandı. Sahada yeni bir sorun görürseniz yeni talep açabilir veya bu yazışmaya not düşebilirsiniz.',
  },
  {
    id: 'redirect',
    label: 'Yönlendirme',
    text: 'Konu ilgili müdürlüğe iletildi. Takip numarası bu talep kaydıdır; ek belge gerekirse buradan yazabilirsiniz.',
  },
] as const

const CITIZEN_REPLY_TEMPLATES = [
  {
    id: 'photo',
    label: 'Konum ekle',
    text: 'Mahalle: \nSokak / yakın nokta: \nEk açıklama: ',
  },
  {
    id: 'thanks',
    label: 'Teşekkür',
    text: 'Bilgilendirme için teşekkürler. Güncelleme olursa buradan takip edeceğim.',
  },
  {
    id: 'still',
    label: 'Devam ediyor',
    text: 'Sorun hâlen devam ediyor. Son gözlem tarih/saat: \nNot: ',
  },
] as const

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
  const [loading, setLoading] = useState(true)

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
    setLoading(true)
    void load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Talep yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [load])

  const templates = useMemo(
    () => (staff ? STAFF_REPLY_TEMPLATES : CITIZEN_REPLY_TEMPLATES),
    [staff],
  )

  const stats = useMemo(() => {
    if (!detail) return null
    const officer = detail.messages.filter((m) => m.senderType === 'Officer').length
    const citizen = detail.messages.filter((m) => m.senderType === 'Citizen').length
    const last = detail.messages[detail.messages.length - 1]
    return { officer, citizen, last }
  }, [detail])

  async function onReply(event: FormEvent) {
    event.preventDefault()
    if (!id || busy) return
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

  async function resolveWithTemplate() {
    if (!id || !detail) return
    const resolvedTemplate = STAFF_REPLY_TEMPLATES.find((t) => t.id === 'resolved')
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (resolvedTemplate && !reply.trim()) {
        await apiFetch(
          `/api/v1/citizen-requests/${id}/messages`,
          {
            method: 'POST',
            body: JSON.stringify({ message: resolvedTemplate.text }),
          },
          true,
        )
      } else if (reply.trim()) {
        await apiFetch(
          `/api/v1/citizen-requests/${id}/messages`,
          {
            method: 'POST',
            body: JSON.stringify({ message: reply.trim() }),
          },
          true,
        )
        setReply('')
      }
      await apiFetch(`/api/v1/citizen-requests/${id}/resolve`, { method: 'POST' }, true)
      setInfo('Yanıt gönderildi ve talep çözüldü.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Çözüm işlemi başarısız.')
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

  function applyTemplate(text: string) {
    setReply(text)
    setInfo('Şablon yüklendi — göndermeden önce düzenleyebilirsiniz.')
    setError(null)
  }

  return (
    <div className="container stack">
      <p className="muted">
        <Link to={backTo}>{backLabel}</Link>
      </p>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      {loading && !detail ? (
        <div className="stack" aria-busy="true" aria-label="Talep yükleniyor">
          <div className="panel stack">
            <span className="skeleton-line skeleton-line--sm" />
            <span className="skeleton-line skeleton-line--lg" />
            <span className="skeleton-line skeleton-line--xl" />
          </div>
          <div className="stats-strip stats-strip--skeleton">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index}>
                <span className="skeleton-line skeleton-line--sm" />
                <span className="skeleton-line skeleton-line--lg" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

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

            {stats ? (
              <div className="stats-strip" aria-label="Yazışma özeti">
                <div>
                  <span className="muted">Mesaj</span>
                  <strong>{detail.messages.length}</strong>
                </div>
                <div>
                  <span className="muted">Vatandaş</span>
                  <strong>{stats.citizen}</strong>
                </div>
                <div>
                  <span className="muted">Belediye</span>
                  <strong>{stats.officer}</strong>
                </div>
                <div>
                  <span className="muted">Son yazan</span>
                  <strong>
                    {stats.last ? senderLabel(stats.last.senderType).split(' ')[0] : '—'}
                  </strong>
                </div>
              </div>
            ) : null}

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
                  <>
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
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => void resolveWithTemplate()}
                    >
                      Yanıtla ve çöz
                    </button>
                  </>
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
            {detail.messages.length === 0 ? (
              <p className="muted">Henüz mesaj yok. İlk yanıtı aşağıdan yazabilirsiniz.</p>
            ) : (
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
            )}
          </section>

          {detail.status !== 'Closed' ? (
            <form className="panel stack" onSubmit={(e) => void onReply(e)}>
              <h3 style={{ margin: 0 }}>{staff ? 'Vatandaşa yanıt yaz' : 'Yanıt yaz'}</h3>
              <div className="dept-chip-row" role="group" aria-label="Hazır yanıt şablonları">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.text)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="reply">Mesaj</label>
                <textarea
                  id="reply"
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  required
                  maxLength={2000}
                  placeholder={
                    staff
                      ? 'Şablon seçin veya inceleme sonucunu yazın…'
                      : 'Şablon seçin veya ek bilgi yazın…'
                  }
                />
                <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
                  {reply.length}/2000
                </p>
              </div>
              <BusyButton busy={busy} busyLabel="Gönderiliyor…">
                Gönder
              </BusyButton>
            </form>
          ) : (
            <div className="notice">Bu talep kapatılmış; yeni mesaj eklenemez.</div>
          )}
        </>
      ) : !loading && error ? (
        <button type="button" className="btn btn-ghost" onClick={() => navigate(backTo)}>
          Geri dön
        </button>
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
