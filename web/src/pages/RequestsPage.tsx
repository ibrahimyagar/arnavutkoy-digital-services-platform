import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  apiFetch,
  type CitizenRequestSummary,
  type Paginated,
  type RequestCategory,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

function RequestsContent() {
  const [data, setData] = useState<Paginated<CitizenRequestSummary> | null>(null)
  const [categories, setCategories] = useState<RequestCategory[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [page, cats] = await Promise.all([
      apiFetch<Paginated<CitizenRequestSummary>>('/api/v1/citizen-requests/mine', {}, true),
      apiFetch<RequestCategory[]>('/api/v1/citizen-requests/categories'),
    ])
    setData(page)
    setCategories(cats)
    setCategoryId((current) => current || cats[0]?.id || '')
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Talepler yüklenemedi.')
    })
  }, [load])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        '/api/v1/citizen-requests',
        {
          method: 'POST',
          body: JSON.stringify({ categoryId, initialMessage: message }),
        },
        true,
      )
      setMessage('')
      setInfo('Talebiniz oluşturuldu.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talep oluşturulamadı.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Taleplerim</h1>
        <p className="muted">Yeni hizmet talebi açın ve durumunu takip edin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

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

      <div className="stack">
        {data?.items.map((item) => (
          <article key={item.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3>
                  <Link to={`/talepler/${item.id}`}>Talep #{item.id.slice(0, 8)}</Link>
                </h3>
                <p className="muted">{new Date(item.createdAtUtc).toLocaleString('tr-TR')}</p>
              </div>
              <span className="badge">{item.status}</span>
            </div>
          </article>
        ))}
        {data && data.items.length === 0 ? <p className="muted">Henüz talep yok.</p> : null}
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
