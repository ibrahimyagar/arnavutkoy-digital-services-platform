import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage, PublicRelated, PublicSection } from '../components/ui/PublicPage'
import { apiFetch, type Announcement, type Paginated } from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'

function excerpt(text: string, max = 160) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trimEnd()}…`
}

function publishedLabel(item: Announcement) {
  const start = item.publishStartUtc ?? item.createdAtUtc
  return new Date(start).toLocaleString('tr-TR')
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const page = await apiFetch<Paginated<Announcement>>(
          '/api/v1/announcements?pageSize=50',
        )
        setItems(page.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Duyurular yüklenemedi.')
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    if (!needle) return items
    return items.filter(
      (item) =>
        item.title.toLocaleLowerCase('tr-TR').includes(needle) ||
        item.content.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [items, q])

  return (
    <PublicPage
      eyebrow="Güncel"
      title="Duyurular"
      lead="Yayımlanmış belediye duyuruları. Arama ile başlık veya metin içinde filtreleyebilirsiniz."
      cover={COVERS.announcements}
    >
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="ann-q">Duyuru ara</label>
        <input
          id="ann-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Örn. Hadımköy, bakım, sosyal"
        />
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <PublicSection title="Liste">
        <div className="stack">
          {filtered.map((item) => (
            <article key={item.id} className="list-row">
              <p className="muted list-row-meta" style={{ margin: 0 }}>
                {publishedLabel(item)}
                {item.publishEndUtc
                  ? ` · Geçerlilik: ${new Date(item.publishEndUtc).toLocaleDateString('tr-TR')}`
                  : ''}
              </p>
              <h3 style={{ margin: 0 }}>
                <Link to={`/duyurular/${item.id}`}>{item.title}</Link>
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                {excerpt(item.content)}
              </p>
              <Link className="announcement-more" to={`/duyurular/${item.id}`}>
                Devamını oku
              </Link>
            </article>
          ))}
          {filtered.length === 0 && !error ? (
            <p className="muted">
              {q ? 'Aramanızla eşleşen duyuru yok.' : 'Yayında duyuru yok.'}
            </p>
          ) : null}
        </div>
      </PublicSection>

      <PublicRelated items={RELATED.media} />
    </PublicPage>
  )
}

export function AnnouncementDetailPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Announcement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      try {
        setItem(await apiFetch<Announcement>(`/api/v1/announcements/${id}`))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Duyuru bulunamadı.')
      }
    })()
  }, [id])

  return (
    <PublicPage
      eyebrow="Duyuru"
      title={item?.title ?? 'Duyuru'}
      lead={undefined}
      cover={COVERS.announcements}
    >
      <p className="muted" style={{ margin: 0 }}>
        <Link to="/duyurular">← Tüm duyurular</Link>
      </p>

      {error ? <div className="error-box">{error}</div> : null}
      {!item && !error ? <p className="muted">Yükleniyor…</p> : null}

      {item ? (
        <>
          <PublicSection tone="soft">
            <p className="muted" style={{ margin: '0 0 0.75rem', fontSize: '0.85rem' }}>
              {publishedLabel(item)}
              {item.publishEndUtc
                ? ` · Geçerlilik sonu: ${new Date(item.publishEndUtc).toLocaleString('tr-TR')}`
                : ''}
            </p>
            <div className="pub-prose announcement-body">{item.content}</div>
          </PublicSection>
          <div className="notice">
            Bağımsız demo duyurusudur; gerçek Arnavutköy Belediyesi bildirimi değildir.
          </div>
          <PublicRelated items={RELATED.media} />
        </>
      ) : null}
    </PublicPage>
  )
}
