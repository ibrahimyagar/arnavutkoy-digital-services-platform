import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  apiFetch,
  type CitizenRequestSummary,
  type Paginated,
  type RequestCategory,
} from '../lib/api'
import { isStaff } from '../lib/roles'
import {
  REQUEST_STATUSES,
  requestStatusBadgeClass,
  requestStatusLabel,
  type RequestStatus,
} from '../lib/requestStatus'
import { RequireAuth } from './PanelPage'

function RequestsContent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const staff = isStaff(user?.roles)
  const [data, setData] = useState<Paginated<CitizenRequestSummary> | null>(null)
  const [categories, setCategories] = useState<RequestCategory[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const listPath = staff ? '/api/v1/citizen-requests' : '/api/v1/citizen-requests/mine'
    const [page, cats] = await Promise.all([
      apiFetch<Paginated<CitizenRequestSummary>>(listPath, {}, true),
      apiFetch<RequestCategory[]>('/api/v1/citizen-requests/categories'),
    ])
    setData(page)
    setCategories(cats)
    setCategoryId((current) => current || cats[0]?.id || '')
  }, [staff])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Talepler yüklenemedi.')
    })
  }, [load])

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const items = useMemo(() => {
    const list = data?.items ?? []
    if (statusFilter === 'all') return list
    return list.filter((item) => item.status === statusFilter)
  }, [data, statusFilter])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const created = await apiFetch<{ id: string }>(
        '/api/v1/citizen-requests',
        {
          method: 'POST',
          body: JSON.stringify({ categoryId, initialMessage: message }),
        },
        true,
      )
      setMessage('')
      setInfo('Talebiniz oluşturuldu.')
      navigate(`/talepler/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep oluşturulamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
          {staff ? 'Hizmet talepleri' : 'Taleplerim'}
        </h1>
        <p className="muted">
          {staff
            ? 'Tüm vatandaş taleplerini inceleyin; detayda yanıtlayın ve durum güncelleyin.'
            : 'Yeni hizmet talebi açın ve durumunu takip edin.'}
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      {!staff ? (
        <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
          <h3>Yeni talep</h3>
          <div className="field">
            <label htmlFor="category">Kategori</label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="message">Mesajınız</label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Örn. Mahallemizde yol çökmesi var…"
              required
              maxLength={2000}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !categoryId}>
            {busy ? 'Gönderiliyor…' : 'Talep oluştur'}
          </button>
        </form>
      ) : null}

      <div className="filter-row" role="tablist" aria-label="Durum filtresi">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === 'all'}
          className={statusFilter === 'all' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setStatusFilter('all')}
        >
          Tümü
        </button>
        {REQUEST_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            role="tab"
            aria-selected={statusFilter === status}
            className={statusFilter === status ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setStatusFilter(status)}
          >
            {requestStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className="stack">
        {items.map((item) => (
          <article key={item.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p className="muted" style={{ margin: '0 0 0.25rem', fontSize: '0.85rem' }}>
                  {categoryMap.get(item.categoryId) ?? 'Kategori'}
                </p>
                <h3 style={{ margin: 0 }}>
                  <Link to={`/talepler/${item.id}`}>Talep #{item.id.slice(0, 8)}</Link>
                </h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {new Date(item.createdAtUtc).toLocaleString('tr-TR')}
                  {item.resolvedAtUtc
                    ? ` · Çözüldü ${new Date(item.resolvedAtUtc).toLocaleString('tr-TR')}`
                    : ''}
                </p>
              </div>
              <span className={requestStatusBadgeClass(item.status)}>
                {requestStatusLabel(item.status)}
              </span>
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Bu filtrede talep yok.</p> : null}
      </div>
    </div>
  )
}

export function RequestsPage() {
  return (
    <RequireAuth>
      <RequestsContent />
    </RequireAuth>
  )
}
