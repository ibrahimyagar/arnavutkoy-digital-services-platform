import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  apiFetch,
  type CitizenRequestSummary,
  type Paginated,
  type SocialAssistanceApplication,
} from '../lib/api'
import { isStaff } from '../lib/roles'
import { RequireAuth } from './PanelPage'

function StaffDeskContent() {
  const [requests, setRequests] = useState<CitizenRequestSummary[]>([])
  const [applications, setApplications] = useState<SocialAssistanceApplication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [reqPage, appPage] = await Promise.all([
      apiFetch<Paginated<CitizenRequestSummary>>('/api/v1/citizen-requests', {}, true),
      apiFetch<Paginated<SocialAssistanceApplication>>('/api/v1/social-assistance', {}, true),
    ])
    setRequests(reqPage.items)
    setApplications(appPage.items)
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Personel verisi yüklenemedi.')
    })
  }, [load])

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    }
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Personel masası</h1>
        <p className="muted">Hizmet talepleri ve sosyal yardım başvurularını yönetin.</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <section className="stack">
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Hizmet talepleri</h2>
        {requests.map((item) => (
          <article key={item.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3>
                  <Link to={`/talepler/${item.id}`}>#{item.id.slice(0, 8)}</Link>
                </h3>
                <p className="muted">{new Date(item.createdAtUtc).toLocaleString('tr-TR')}</p>
              </div>
              <span className="badge">{item.status}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {item.status === 'Pending' ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    void run(
                      () =>
                        apiFetch(`/api/v1/citizen-requests/${item.id}/under-review`, {
                          method: 'POST',
                        }, true),
                      'İncelemeye alındı.',
                    )
                  }
                >
                  İncelemeye al
                </button>
              ) : null}
              {item.status === 'UnderReview' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    void run(
                      () =>
                        apiFetch(`/api/v1/citizen-requests/${item.id}/resolve`, {
                          method: 'POST',
                        }, true),
                      'Talep çözüldü.',
                    )
                  }
                >
                  Çöz
                </button>
              ) : null}
              {item.status !== 'Closed' ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    void run(
                      () =>
                        apiFetch(`/api/v1/citizen-requests/${item.id}/close`, {
                          method: 'POST',
                        }, true),
                      'Talep kapatıldı.',
                    )
                  }
                >
                  Kapat
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {requests.length === 0 ? <p className="muted">Açık talep yok.</p> : null}
      </section>

      <section className="stack">
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Sosyal yardım başvuruları</h2>
        {applications.map((app) => (
          <article key={app.id} className="panel stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3>{app.type}</h3>
                <p className="muted">
                  {app.householdSize} kişi · ₺{app.monthlyIncome.toFixed(0)}
                </p>
              </div>
              <span className="badge">{app.status}</span>
            </div>
            <p style={{ margin: 0 }}>{app.householdSummary}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {app.status === 'Submitted' ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    void run(
                      () =>
                        apiFetch(`/api/v1/social-assistance/${app.id}/start-review`, {
                          method: 'POST',
                        }, true),
                      'İnceleme başladı.',
                    )
                  }
                >
                  İncelemeye al
                </button>
              ) : null}
              {app.status === 'Submitted' || app.status === 'UnderReview' ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      void run(
                        () =>
                          apiFetch(`/api/v1/social-assistance/${app.id}/decide`, {
                            method: 'POST',
                            body: JSON.stringify({ approve: true, note: 'Uygun görüldü' }),
                          }, true),
                        'Başvuru onaylandı.',
                      )
                    }
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      void run(
                        () =>
                          apiFetch(`/api/v1/social-assistance/${app.id}/decide`, {
                            method: 'POST',
                            body: JSON.stringify({
                              approve: false,
                              note: 'Kriterler sağlanmadı',
                            }),
                          }, true),
                        'Başvuru reddedildi.',
                      )
                    }
                  >
                    Reddet
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
        {applications.length === 0 ? <p className="muted">Başvuru yok.</p> : null}
      </section>
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

export function StaffDeskPage() {
  return (
    <RequireAuth>
      <StaffGate>
        <StaffDeskContent />
      </StaffGate>
    </RequireAuth>
  )
}
