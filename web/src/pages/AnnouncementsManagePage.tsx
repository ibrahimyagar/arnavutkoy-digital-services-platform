import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { StaffGate } from '../components/RoleGates'
import { PageHeader } from '../components/ui/PageChrome'
import { apiFetch, type Announcement, type Paginated } from '../lib/api'
import { RequireAuth } from './PanelPage'

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Taslak',
  Published: 'Yayında',
  Archived: 'Arşiv',
}

const TITLE_TEMPLATES = [
  {
    title: 'Hadımköy sanayi bölgesi yol çalışması',
    content:
      'Hadımköy sanayi bölgesinde planlı asfalt çalışması nedeniyle 07:00–17:00 arasında tek şerit uygulama yapılacaktır. Alternatif güzergâh tabelalarla işaretlenecektir.',
  },
  {
    title: 'Taşoluk sosyal yardım başvuru takvimi',
    content:
      'Taşoluk ve çevresi için sosyal yardım başvuruları bu ayın son iş gününe kadar dijital platform üzerinden alınmaya devam edecektir. Eksik belge durumunda başvuru tamamlanamaz.',
  },
  {
    title: 'Durusu sahil temizliği duyurusu',
    content:
      'Durusu sahil bandında gönüllü temizlik etkinliği cumartesi sabahı düzenlenecektir. Katılım için belediye hizmet masasına veya dijital talepler kanalına bilgi bırakabilirsiniz.',
  },
  {
    title: 'Arnavutköy Merkez su kesintisi bildirimi',
    content:
      'Planlı bakım nedeniyle Arnavutköy Merkez mahallesinde kısa süreli su kesintisi yaşanabilir. Aboneler /su ekranından abonelik durumunu kontrol edebilir.',
  },
] as const

type StatusFilter = 'all' | 'Draft' | 'Published' | 'Archived'

function statusBadgeClass(status: string) {
  switch (status) {
    case 'Published':
      return 'badge badge-ok'
    case 'Draft':
      return 'badge badge-warn'
    case 'Archived':
      return 'badge'
    default:
      return 'badge'
  }
}

function excerpt(text: string, max = 160) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max - 1)}…`
}

function defaultEndLocal(daysAhead: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(18, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function scheduleHint(item: Announcement) {
  if (item.status === 'Draft') {
    return item.publishEndUtc
      ? `Taslak · önerilen bitiş ${new Date(item.publishEndUtc).toLocaleString('tr-TR')}`
      : 'Taslak · yayın bitişi tanımlı değil'
  }
  if (item.status === 'Archived') {
    return 'Arşiv kaydı · halka açık listede görünmez'
  }
  if (!item.publishStartUtc) return 'Yayında'
  const start = new Date(item.publishStartUtc)
  if (!item.publishEndUtc) {
    return `Yayında · ${start.toLocaleString('tr-TR')} itibarıyla süresiz`
  }
  const end = new Date(item.publishEndUtc)
  const hoursLeft = (end.getTime() - Date.now()) / 36e5
  if (hoursLeft < 0) return `Bitiş tarihi geçmiş · ${end.toLocaleString('tr-TR')}`
  if (hoursLeft < 48) {
    return `Yakında sona eriyor · ${end.toLocaleString('tr-TR')}`
  }
  return `Yayın penceresi ${start.toLocaleDateString('tr-TR')} – ${end.toLocaleDateString('tr-TR')}`
}

function AnnouncementsManageContent() {
  const [items, setItems] = useState<Announcement[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [q, setQ] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [publishEndLocal, setPublishEndLocal] = useState(() => defaultEndLocal(30))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const page = await apiFetch<Paginated<Announcement>>(
      '/api/v1/announcements/managed?pageSize=100',
      {},
      true,
    )
    setItems(page.items)
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Duyurular yüklenemedi.')
    })
  }, [load])

  const counts = useMemo(() => {
    const next: Record<string, number> = {
      all: items.length,
      Draft: 0,
      Published: 0,
      Archived: 0,
    }
    for (const item of items) {
      next[item.status] = (next[item.status] ?? 0) + 1
    }
    return next
  }, [items])

  const expiringSoon = useMemo(
    () =>
      items.filter((item) => {
        if (item.status !== 'Published' || !item.publishEndUtc) return false
        const hoursLeft = (new Date(item.publishEndUtc).getTime() - Date.now()) / 36e5
        return hoursLeft >= 0 && hoursLeft < 48
      }).length,
    [items],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!needle) return true
      return `${item.title} ${item.content}`.toLocaleLowerCase('tr-TR').includes(needle)
    })
  }, [items, statusFilter, q])

  async function run(id: string, action: () => Promise<unknown>, okMessage: string) {
    setBusyId(id)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusyId(null)
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await run(
      'create',
      async () => {
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
        setPublishEndLocal(defaultEndLocal(30))
      },
      'Taslak duyuru oluşturuldu. Yayınlamak için listeden “Yayınla”ya basın.',
    )
  }

  async function onSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!editingId) return
    await run(
      editingId,
      async () => {
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
      },
      'Taslak güncellendi.',
    )
  }

  function applyTemplate(template: (typeof TITLE_TEMPLATES)[number]) {
    setTitle(template.title)
    setContent(template.content)
    setPublishEndLocal(defaultEndLocal(14))
    setInfo('Şablon yüklendi — gerekirse düzenleyip taslak oluşturun.')
    setError(null)
  }

  return (
    <div className="container stack page">
      <PageHeader
        title="Duyuru yönetimi"
        description="Taslak → yayın → arşiv."
        actions={
          <Link className="btn btn-ghost" to="/duyurular">
            Halka açık liste
          </Link>
        }
      />

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="stats-strip" aria-label="Duyuru özeti">
        <div>
          <span className="muted">Toplam</span>
          <strong>{counts.all}</strong>
        </div>
        <div>
          <span className="muted">Taslak</span>
          <strong>{counts.Draft ?? 0}</strong>
        </div>
        <div>
          <span className="muted">Yayında</span>
          <strong>{counts.Published ?? 0}</strong>
        </div>
        <div>
          <span className="muted">48s içinde biten</span>
          <strong>{expiringSoon}</strong>
        </div>
      </div>

      <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
        <h3 style={{ margin: 0 }}>Yeni taslak</h3>
        <div className="dept-chip-row" role="group" aria-label="Hazır duyuru şablonları">
          {TITLE_TEMPLATES.map((template) => (
            <button key={template.title} type="button" onClick={() => applyTemplate(template)}>
              {template.title.split(' ').slice(0, 3).join(' ')}…
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="annTitle">Başlık</label>
          <input
            id="annTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Örn. Hadımköy yol çalışması"
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
            placeholder="Vatandaşın göreceği metin…"
          />
        </div>
        <div className="form-two-col">
          <div className="field">
            <label htmlFor="annEnd">Yayın bitiş (isteğe bağlı)</label>
            <input
              id="annEnd"
              type="datetime-local"
              value={publishEndLocal}
              onChange={(e) => setPublishEndLocal(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="annEndQuick">Hızlı bitiş</label>
            <select
              id="annEndQuick"
              value=""
              onChange={(e) => {
                const days = Number(e.target.value)
                if (!Number.isFinite(days) || days <= 0) return
                setPublishEndLocal(defaultEndLocal(days))
              }}
            >
              <option value="">Seçin…</option>
              <option value="7">7 gün</option>
              <option value="14">14 gün</option>
              <option value="30">30 gün</option>
              <option value="90">90 gün</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busyId === 'create'}>
          {busyId === 'create' ? 'Kaydediliyor…' : 'Taslak oluştur'}
        </button>
      </form>

      <div className="field">
        <label htmlFor="ann-search">Ara</label>
        <input
          id="ann-search"
          type="search"
          placeholder="Başlık veya içerik…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="desk-tabs" role="tablist" aria-label="Duyuru durum filtresi">
        {(
          [
            { id: 'all', label: 'Tümü' },
            { id: 'Draft', label: 'Taslak' },
            { id: 'Published', label: 'Yayında' },
            { id: 'Archived', label: 'Arşiv' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.id}
            className={statusFilter === filter.id ? 'is-active' : undefined}
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label}
            <span>{filter.id === 'all' ? counts.all : (counts[filter.id] ?? 0)}</span>
          </button>
        ))}
      </div>

      <div className="stack">
        {filtered.map((item) => {
          const busy = busyId === item.id
          return (
            <article key={item.id} className="panel stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Oluşturma: {new Date(item.createdAtUtc).toLocaleString('tr-TR')}
                  </p>
                  <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                    {scheduleHint(item)}
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
                <p className="muted" style={{ margin: 0 }}>
                  {excerpt(item.content)}
                </p>
              )}

              {editingId === item.id ? null : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {item.status === 'Published' ? (
                    <Link className="btn btn-ghost" to={`/duyurular/${item.id}`}>
                      Halka açık gör
                    </Link>
                  ) : null}
                  {item.status === 'Draft' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={Boolean(busyId)}
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
                        disabled={Boolean(busyId)}
                        onClick={() =>
                          void run(
                            item.id,
                            () =>
                              apiFetch(
                                `/api/v1/announcements/${item.id}/publish`,
                                { method: 'POST' },
                                true,
                              ),
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
                      disabled={Boolean(busyId)}
                      onClick={() =>
                        void run(
                          item.id,
                          () =>
                            apiFetch(
                              `/api/v1/announcements/${item.id}/archive`,
                              { method: 'POST' },
                              true,
                            ),
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
          )
        })}
        {filtered.length === 0 ? (
          <p className="muted">Bu filtrede duyuru yok. Yukarıdaki şablonlarla hızlı taslak oluşturabilirsiniz.</p>
        ) : null}
      </div>
    </div>
  )
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
