import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch, type Announcement, type Paginated } from '../lib/api'
import { isStaff } from '../lib/roles'
import { RequireAuth } from './PanelPage'

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Taslak',
  Published: 'Yayında',
  Archived: 'Arşiv',
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Published':
      return 'badge badge-ok'
    case 'Draft':
      return 'badge badge-warn'
    default:
      return 'badge'
  }
}

function AnnouncementsManageContent() {
  const [items, setItems] = useState<Announcement[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Published' | 'Archived'>('all')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishEndLocal, setPublishEndLocal] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const query =
      statusFilter === 'all'
        ? '/api/v1/announcements/managed?pageSize=50'
        : `/api/v1/announcements/managed?pageSize=50&status=${statusFilter}`
    const page = await apiFetch<Paginated<Announcement>>(query, {}, true)
    setItems(page.items)
  }, [statusFilter])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Duyurular yüklenemedi.')
    })
  }, [load])

  const filters = useMemo(
    () =>
      [
        { id: 'all' as const, label: 'Tümü' },
        { id: 'Draft' as const, label: 'Taslak' },
        { id: 'Published' as const, label: 'Yayında' },
        { id: 'Archived' as const, label: 'Arşiv' },
      ] as const,
    [],
  )

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      await apiFetch(
        '/api/v1/announcements',
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            publishEndUtc: publishEndLocal ? new Date(publishEndLocal).toISOString() : null,
          }),
        },
        true,
      )
      setTitle('')
      setContent('')
      setPublishEndLocal('')
    }, 'Taslak duyuru oluşturuldu.')
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!editingId) return
    await run(async () => {
      await apiFetch(
        `/api/v1/announcements/${editingId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent.trim(),
          }),
        },
        true,
      )
      setEditingId(null)
    }, 'Taslak güncellendi.')
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Duyuru yönetimi</h1>
        <p className="muted">Taslak oluşturun, düzenleyin, yayınlayın veya arşivleyin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3>Yeni taslak</h3>
        <div className="field">
          <label htmlFor="annTitle">Başlık</label>
          <input
            id="annTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div className="field">
          <label htmlFor="annContent">İçerik</label>
          <textarea
            id="annContent"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={8000}
          />
        </div>
        <div className="field">
          <label htmlFor="annEnd">Yayın bitiş (isteğe bağlı)</label>
          <input
            id="annEnd"
            type="datetime-local"
            value={publishEndLocal}
            onChange={(e) => setPublishEndLocal(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Kaydediliyor…' : 'Taslak oluştur'}
        </button>
      </form>

      <div className="filter-row" role="tablist" aria-label="Duyuru durum filtresi">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.id}
            className={statusFilter === filter.id ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{item.title}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Oluşturma: {new Date(item.createdAtUtc).toLocaleString('tr-TR')}
                  {item.publishStartUtc
                    ? ` · Yayın: ${new Date(item.publishStartUtc).toLocaleString('tr-TR')}`
                    : ''}
                  {item.publishEndUtc
                    ? ` · Bitiş: ${new Date(item.publishEndUtc).toLocaleString('tr-TR')}`
                    : ''}
                </p>
              </div>
              <span className={statusBadgeClass(item.status)}>
                {STATUS_LABELS[item.status] ?? item.status}
              </span>
            </div>

            {editingId === item.id ? (
              <form className="stack" onSubmit={(e) => void onSaveEdit(e)}>
                <div className="field">
                  <label htmlFor={`edit-title-${item.id}`}>Başlık</label>
                  <input
                    id={`edit-title-${item.id}`}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor={`edit-content-${item.id}`}>İçerik</label>
                  <textarea
                    id={`edit-content-${item.id}`}
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    Kaydet
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditingId(null)}
                    disabled={busy}
                  >
                    Vazgeç
                  </button>
                </div>
              </form>
            ) : (
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.content}</p>
            )}

            {editingId === item.id ? null : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {item.status === 'Draft' ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(item.id)
                        setEditTitle(item.title)
                        setEditContent(item.content)
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            apiFetch(`/api/v1/announcements/${item.id}/publish`, { method: 'POST' }, true),
                          'Duyuru yayına alındı.',
                        )
                      }
                    >
                      Yayınla
                    </button>
                  </>
                ) : null}
                {item.status === 'Published' ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          apiFetch(`/api/v1/announcements/${item.id}/archive`, { method: 'POST' }, true),
                        'Duyuru arşivlendi.',
                      )
                    }
                  >
                    Arşivle
                  </button>
                ) : null}
              </div>
            )}
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Bu filtrede duyuru yok.</p> : null}
      </div>
    </div>
  )
}

function StaffGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !isStaff(user.roles)) {
    return <Navigate to="/panel" replace />
  }
  return children
}

export function AnnouncementsManagePage() {
  return (
    <RequireAuth>
      <StaffGate>
        <AnnouncementsManageContent />
      </StaffGate>
    </RequireAuth>
  )
}
