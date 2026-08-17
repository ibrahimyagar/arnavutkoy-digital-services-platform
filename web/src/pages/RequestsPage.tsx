import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/ui/PageChrome'
import { BusyButton } from '../components/ui/BusyButton'
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

const CATEGORY_HINTS: Record<string, { hint: string; template: string }> = {
  'Altyapı Arızası': {
    hint: 'Konum (mahalle/sokak), arıza türü ve ne zamandan beri sürdüğünü yazın.',
    template:
      'Mahalle: \nSokak: \nArıza: (çökme / su baskını / kapak) \nNe zamandan beri: \nEk not: ',
  },
  Temizlik: {
    hint: 'Cadde, park veya konteyner noktasını net belirtin.',
    template: 'Mahalle: \nKonum: \nSorun: (çöp birikimi / süpürülmemiş cadde) \nEk not: ',
  },
  'Gürültü Şikayeti': {
    hint: 'Saat aralığı ve kaynak (inşaat, işyeri vb.) yardımcı olur.',
    template: 'Mahalle: \nAdres/yakın nokta: \nSaat aralığı: \nKaynak: \nEk not: ',
  },
  'Yol Bakımı': {
    hint: 'Çukur, kaldırımı bozukluk veya işaret eksikliğini tarif edin.',
    template: 'Mahalle: \nCadde/sokak: \nSorun: \nTrafik etkisi: \nEk not: ',
  },
  'Park ve Bahçeler': {
    hint: 'Park adı veya yeşil alan konumunu yazın.',
    template: 'Park / alan: \nMahalle: \nİhtiyaç: (budama / sulama / aydınlatma) \nEk not: ',
  },
  Aydınlatma: {
    hint: 'Direk numarası veya kavşak tarifi varsa ekleyin.',
    template: 'Mahalle: \nSokak/kavşak: \nSorun: (sönük / kırık) \nEk not: ',
  },
  'Hayvan Toplama': {
    hint: 'Güvenli yaklaşım için yaklaşık konum yeterlidir.',
    template: 'Mahalle: \nYaklaşık konum: \nDurum: \nEk not: ',
  },
  'İmar / Ruhsat Bilgi': {
    hint: 'Bilgi talebi için ada/parsel veya adres yazabilirsiniz.',
    template: 'Konu: \nAdres / ada-parsel: \nSoru: \nEk not: ',
  },
  Diğer: {
    hint: 'Kısa ve net bir özet + konum yazın.',
    template: 'Konu: \nMahalle: \nAçıklama: ',
  },
}

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
  const [loading, setLoading] = useState(true)

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
    void load()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Talepler yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [load])

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const selectedCategoryName = categoryMap.get(categoryId) ?? ''
  const selectedHint = CATEGORY_HINTS[selectedCategoryName]

  const items = useMemo(() => {
    const list = data?.items ?? []
    if (statusFilter === 'all') return list
    return list.filter((item) => item.status === statusFilter)
  }, [data, statusFilter])

  const statusCounts = useMemo(() => {
    const list = data?.items ?? []
    const counts: Record<string, number> = { all: list.length }
    for (const status of REQUEST_STATUSES) {
      counts[status] = list.filter((item) => item.status === status).length
    }
    return counts
  }, [data])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    if (busy) return
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

  function applyTemplate() {
    if (!selectedHint) return
    setMessage((current) => (current.trim() ? current : selectedHint.template))
  }

  return (
    <div className="container stack page">
      <PageHeader
        title={staff ? 'Hizmet talepleri' : 'Hizmet masası'}
        description={
          staff
            ? 'Vatandaş taleplerini inceleyin, yanıtlayın ve durum güncelleyin.'
            : 'Yeni talep oluşturun veya mevcut taleplerinizi takip edin.'
        }
      />

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="request-stats" aria-label="Talep özeti">
        <div>
          <strong>{statusCounts.all ?? 0}</strong>
          <span className="muted">Toplam</span>
        </div>
        {REQUEST_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? 'is-active' : ''}
            onClick={() => setStatusFilter(status)}
          >
            <strong>{statusCounts[status] ?? 0}</strong>
            <span className="muted">{requestStatusLabel(status)}</span>
          </button>
        ))}
      </div>

      <div className={`desk-split${staff ? ' is-single' : ''}`}>
        {!staff ? (
          <form className="panel stack" onSubmit={(e) => void onCreate(e)}>
            <h3 style={{ margin: 0 }}>Yeni talep</h3>
            <div className="field">
              <label htmlFor="category">Başvuru türü</label>
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
              {selectedHint ? (
                <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
                  {selectedHint.hint}
                </p>
              ) : null}
            </div>
            <div className="field">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  alignItems: 'end',
                }}
              >
                <label htmlFor="message">Mesajınız</label>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                  onClick={applyTemplate}
                >
                  Şablon doldur
                </button>
              </div>
              <textarea
                id="message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Örn. Hadımköy Caddesi’nde kaldırım çökmesi var…"
                required
                maxLength={2000}
              />
              <p className="muted" style={{ margin: 0, fontSize: '0.8rem', textAlign: 'right' }}>
                {message.length}/2000
              </p>
            </div>
            <BusyButton busy={busy} disabled={!categoryId} busyLabel="Gönderiliyor…">
              Gönder
            </BusyButton>
          </form>
        ) : null}

        <section className="panel stack">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0 }}>{staff ? 'Tüm talepler' : 'Taleplerim'}</h3>
            <div className="desk-tabs" role="tablist" aria-label="Durum filtresi">
              <button
                type="button"
                role="tab"
                aria-selected={statusFilter === 'all'}
                className={statusFilter === 'all' ? 'is-active' : undefined}
                onClick={() => setStatusFilter('all')}
              >
                Tümü
                <span>{statusCounts.all ?? 0}</span>
              </button>
              {REQUEST_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === status}
                  className={statusFilter === status ? 'is-active' : undefined}
                  onClick={() => setStatusFilter(status)}
                >
                  {requestStatusLabel(status)}
                  <span>{statusCounts[status] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Talep</th>
                  <th>Kategori</th>
                  <th>Zaman</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index} aria-hidden>
                      <td colSpan={4}>
                        <span className="skeleton-line skeleton-line--xl" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/talepler/${item.id}`}>#{item.id.slice(0, 8)}</Link>
                    </td>
                    <td>{categoryMap.get(item.categoryId) ?? 'Kategori'}</td>
                    <td>{new Date(item.createdAtUtc).toLocaleString('tr-TR')}</td>
                    <td>
                      <span className={requestStatusBadgeClass(item.status)}>
                        {requestStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      {staff
                        ? 'Bu filtrede talep yok.'
                        : 'Henüz talep yok — soldaki formdan oluşturun.'}
                    </td>
                  </tr>
                ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
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
