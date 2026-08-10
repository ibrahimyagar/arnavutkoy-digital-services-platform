import { useCallback, useEffect, useState, type FormEvent } from 'react'
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

function SocialAssistanceContent() {
  const [items, setItems] = useState<SocialAssistanceApplication[]>([])
  const [type, setType] = useState('Food')
  const [householdSize, setHouseholdSize] = useState(3)
  const [monthlyIncome, setMonthlyIncome] = useState(12000)
  const [householdSummary, setHouseholdSummary] = useState('')
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

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Sosyal yardım</h1>
        <p className="muted">Başvurunuzu iletin; değerlendirme sonucunu buradan izleyin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

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
        </div>
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
        <div className="field">
          <label htmlFor="summary">Hane özeti</label>
          <textarea
            id="summary"
            rows={4}
            value={householdSummary}
            onChange={(e) => setHouseholdSummary(e.target.value)}
            placeholder="Kısa durum özeti…"
            required
            maxLength={2000}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Gönderiliyor…' : 'Başvuru gönder'}
        </button>
      </form>

      <div className="stack">
        {items.map((app) => (
          <article key={app.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3>{typeLabels[app.type] ?? app.type}</h3>
                <p className="muted">
                  {app.householdSize} kişi · ₺{app.monthlyIncome.toFixed(0)} ·{' '}
                  {new Date(app.submittedAtUtc).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <span className="badge">{app.status}</span>
            </div>
            <p style={{ margin: 0 }}>{app.householdSummary}</p>
            {app.reviewNote ? <p className="muted">Not: {app.reviewNote}</p> : null}
            {app.status === 'Submitted' || app.status === 'UnderReview' ? (
              <button type="button" className="btn btn-ghost" onClick={() => void withdraw(app.id)}>
                Geri çek
              </button>
            ) : null}
          </article>
        ))}
        {items.length === 0 ? <p className="muted">Başvurunuz yok.</p> : null}
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
