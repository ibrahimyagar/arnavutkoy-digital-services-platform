import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  apiFetch,
  type Paginated,
  type SocialAssistanceApplication,
} from '../lib/api'
import { RequireAuth } from './PanelPage'

const typeLabels: Record<string, string> = {
  Food: 'Gıda',
  Heating: 'Isınma',
  Education: 'Eğitim',
  Healthcare: 'Sağlık',
  Other: 'Diğer',
}

const typeHints: Record<string, string> = {
  Food: 'Taşoluk / Merkez için gıda kolisi taleplerinde hane ve gelir net yazılmalı.',
  Heating: 'Isınma yardımı için kış dönemi ve yakıt ihtiyacını kısaca belirtin.',
  Education: 'Öğrenci sayısı ve okul bilgisini hane özetine ekleyin.',
  Healthcare: 'Kronik hastalık veya engel durumunu (kişisel veri olmadan) özetleyin.',
  Other: 'Talebinizi kısa başlık + ihtiyaç olarak yazın.',
}

const statusLabels: Record<string, string> = {
  Submitted: 'Gönderildi',
  UnderReview: 'İnceleniyor',
  Approved: 'Onaylandı',
  Rejected: 'Reddedildi',
  Withdrawn: 'Geri çekildi',
}

function statusBadge(status: string) {
  if (status === 'Approved') return 'badge badge-ok'
  if (status === 'Rejected' || status === 'Withdrawn') return 'badge badge-danger'
  if (status === 'UnderReview') return 'badge badge-warn'
  return 'badge'
}

function SocialAssistanceContent() {
  const [items, setItems] = useState<SocialAssistanceApplication[]>([])
  const [type, setType] = useState('Food')
  const [householdSize, setHouseholdSize] = useState(3)
  const [monthlyIncome, setMonthlyIncome] = useState(12000)
  const [householdSummary, setHouseholdSummary] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const page = await apiFetch<Paginated<SocialAssistanceApplication>>(
      '/api/v1/social-assistance/mine',
      {},
      true,
    )
    setItems(page.items)
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Başvurular yüklenemedi.')
    })
  }, [load])

  const perCapita = householdSize > 0 ? monthlyIncome / householdSize : 0

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    for (const item of items) {
      counts[item.status] = (counts[item.status] ?? 0) + 1
    }
    return counts
  }, [items])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await apiFetch(
        '/api/v1/social-assistance',
        {
          method: 'POST',
          body: JSON.stringify({
            type,
            householdSize,
            monthlyIncome,
            householdSummary,
            extraFieldsJson: null,
          }),
        },
        true,
      )
      setHouseholdSummary('')
      setInfo('Başvurunuz alındı.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Başvuru gönderilemedi.')
    } finally {
      setBusy(false)
    }
  }

  async function withdraw(id: string) {
    setError(null)
    setInfo(null)
    try {
      await apiFetch(`/api/v1/social-assistance/${id}/withdraw`, { method: 'POST' }, true)
      setInfo('Başvuru geri çekildi.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geri çekme başarısız.')
    }
  }

  function applyTemplate() {
    const templates: Record<string, string> = {
      Food: 'Mahalle: Taşoluk\nHane durumu: \nGıda ihtiyacı: \nEk not: ',
      Heating: 'Mahalle: \nYakıt türü: \nKonut tipi: \nEk not: ',
      Education: 'Mahalle: \nÖğrenci sayısı: \nOkul: \nİhtiyaç: \nEk not: ',
      Healthcare: 'Mahalle: \nİhtiyaç özeti: \nEk not: ',
      Other: 'Mahalle: \nKonu: \nAçıklama: ',
    }
    setHouseholdSummary((current) => (current.trim() ? current : templates[type] ?? ''))
  }

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Sosyal yardım</h1>
        <p className="muted">
          Başvurunuzu iletin; değerlendirme sonucunu buradan izleyin. Onay sonrası süreçler demo
          amaçlıdır — <Link to="/vezne">vezne</Link> ile ilişkili borç ödemesinden ayrıdır.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="request-stats" aria-label="Başvuru özeti">
        <button
          type="button"
          className={statusFilter === 'all' ? 'is-active' : ''}
          onClick={() => setStatusFilter('all')}
        >
          <strong>{statusCounts.all ?? 0}</strong>
          <span className="muted">Toplam</span>
        </button>
        {Object.keys(statusLabels).map((status) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? 'is-active' : ''}
            onClick={() => setStatusFilter(status)}
          >
            <strong>{statusCounts[status] ?? 0}</strong>
            <span className="muted">{statusLabels[status]}</span>
          </button>
        ))}
      </div>

      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
        <h3>Yeni başvuru</h3>
        <div className="field">
          <label htmlFor="atype">Yardım türü</label>
          <select id="atype" value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem' }}>
            {typeHints[type]}
          </p>
        </div>
        <div className="form-two-col">
          <div className="field">
            <label htmlFor="size">Hane büyüklüğü</label>
            <input
              id="size"
              type="number"
              min={1}
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="income">Aylık gelir (₺)</label>
            <input
              id="income"
              type="number"
              min={0}
              step="0.01"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              required
            />
          </div>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Kişi başı yaklaşık gelir: ₺{perCapita.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </p>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'end' }}>
            <label htmlFor="summary">Hane özeti</label>
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
            id="summary"
            rows={5}
            value={householdSummary}
            onChange={(e) => setHouseholdSummary(e.target.value)}
            placeholder="Mahalle, hane durumu ve ihtiyaç özeti…"
            required
            maxLength={2000}
          />
          <p className="muted" style={{ margin: 0, fontSize: '0.8rem', textAlign: 'right' }}>
            {householdSummary.length}/2000
          </p>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Gönderiliyor…' : 'Başvuru gönder'}
        </button>
      </form>

      <div className="stack">
        {filtered.map((app) => (
          <article key={app.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{typeLabels[app.type] ?? app.type}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {app.householdSize} kişi · ₺{app.monthlyIncome.toFixed(0)} ·{' '}
                  {new Date(app.submittedAtUtc).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className={statusBadge(app.status)}>
                {statusLabels[app.status] ?? app.status}
              </span>
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{app.householdSummary}</p>
            {app.reviewNote ? <p className="muted">Değerlendirme notu: {app.reviewNote}</p> : null}
            {app.status === 'Submitted' || app.status === 'UnderReview' ? (
              <button type="button" className="btn btn-ghost" onClick={() => void withdraw(app.id)}>
                Geri çek
              </button>
            ) : null}
          </article>
        ))}
        {filtered.length === 0 ? (
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>Bu filtrede başvuru yok</h3>
            <p className="muted" style={{ margin: 0 }}>
              İlk başvuruyu yukarıdaki formdan oluşturun. Taşoluk sosyal yardım duyurusuna da göz
              atabilirsiniz.
            </p>
            <Link className="btn btn-ghost" to="/duyurular" style={{ justifySelf: 'start' }}>
              Duyurulara git
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function SocialAssistancePage() {
  return (
    <RequireAuth>
      <SocialAssistanceContent />
    </RequireAuth>
  )
}
