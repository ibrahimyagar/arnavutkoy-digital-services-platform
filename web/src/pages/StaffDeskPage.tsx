import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { StaffGate } from '../components/RoleGates'
import {
  apiFetch,
  type CitizenRequestSummary,
  type Paginated,
  type RequestCategory,
  type SocialAssistanceApplication,
} from '../lib/api'
import {
  REQUEST_STATUSES,
  requestStatusBadgeClass,
  requestStatusLabel,
  type RequestStatus,
} from '../lib/requestStatus'
import { RequireAuth } from './PanelPage'

const aidTypeLabels: Record<string, string> = {
  Food: 'Gıda',
  Heating: 'Isınma',
  Education: 'Eğitim',
  Healthcare: 'Sağlık',
  Other: 'Diğer',
}

const aidStatusLabels: Record<string, string> = {
  Submitted: 'Gönderildi',
  UnderReview: 'İnceleniyor',
  Approved: 'Onaylandı',
  Rejected: 'Reddedildi',
  Withdrawn: 'Geri çekildi',
}

function aidBadge(status: string) {
  if (status === 'Approved') return 'badge badge-ok'
  if (status === 'Rejected' || status === 'Withdrawn') return 'badge badge-danger'
  if (status === 'UnderReview') return 'badge badge-warn'
  return 'badge'
}

type DeskTab = 'requests' | 'aid'

function StaffDeskContent() {
  const [tab, setTab] = useState<DeskTab>('requests')
  const [requests, setRequests] = useState<CitizenRequestSummary[]>([])
  const [applications, setApplications] = useState<SocialAssistanceApplication[]>([])
  const [categories, setCategories] = useState<RequestCategory[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all')
  const [aidFilter, setAidFilter] = useState<'all' | string>('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [reqPage, appPage, cats] = await Promise.all([
      apiFetch<Paginated<CitizenRequestSummary>>('/api/v1/citizen-requests?pageSize=100', {}, true),
      apiFetch<Paginated<SocialAssistanceApplication>>(
        '/api/v1/social-assistance?pageSize=100',
        {},
        true,
      ),
      apiFetch<RequestCategory[]>('/api/v1/citizen-requests/categories'),
    ])
    setRequests(reqPage.items)
    setApplications(appPage.items)
    setCategories(cats)
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Personel verisi yüklenemedi.')
    })
  }, [load])

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const requestCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length }
    for (const status of REQUEST_STATUSES) {
      counts[status] = requests.filter((item) => item.status === status).length
    }
    return counts
  }, [requests])

  const aidCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length }
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1
    }
    return counts
  }, [applications])

  const filteredRequests = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return requests.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!needle) return true
      const cat = categoryMap.get(item.categoryId) ?? ''
      return `${item.id} ${cat}`.toLocaleLowerCase('tr-TR').includes(needle)
    })
  }, [requests, statusFilter, q, categoryMap])

  const filteredAid = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return applications.filter((app) => {
      if (aidFilter !== 'all' && app.status !== aidFilter) return false
      if (!needle) return true
      const type = aidTypeLabels[app.type] ?? app.type
      return `${type} ${app.householdSummary} ${app.status}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [applications, aidFilter, q])

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

  return (
    <div className="container stack page">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Personel masası</h1>
        <p className="muted">
          Talepleri ve sosyal yardım başvurularını tek yerden yönetin. Su / emlak borç kesimi için{' '}
          <Link to="/su-yonetimi">su</Link> ve <Link to="/mulk-yonetimi">mülk</Link> panellerine
          gidin.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="desk-tabs" role="tablist" aria-label="Masa sekmeleri">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'requests'}
          className={tab === 'requests' ? 'is-active' : ''}
          onClick={() => setTab('requests')}
        >
          Hizmet talepleri
          <span>{requestCounts.all}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'aid'}
          className={tab === 'aid' ? 'is-active' : ''}
          onClick={() => setTab('aid')}
        >
          Sosyal yardım
          <span>{aidCounts.all}</span>
        </button>
      </div>

      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="desk-q">Ara</label>
        <input
          id="desk-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === 'requests' ? 'Talep no / kategori' : 'Tür / özet / durum'}
        />
      </div>

      {tab === 'requests' ? (
        <section className="stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.35rem' }}>
              Açık işler
            </h2>
            <Link className="btn btn-ghost" to="/talepler" style={{ padding: '0.55rem 0.95rem' }}>
              Tam liste
            </Link>
          </div>

          <div className="request-stats" aria-label="Talep özeti">
            <button
              type="button"
              className={statusFilter === 'all' ? 'is-active' : ''}
              onClick={() => setStatusFilter('all')}
            >
              <strong>{requestCounts.all}</strong>
              <span className="muted">Tümü</span>
            </button>
            {REQUEST_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? 'is-active' : ''}
                onClick={() => setStatusFilter(status)}
              >
                <strong>{requestCounts[status] ?? 0}</strong>
                <span className="muted">{requestStatusLabel(status)}</span>
              </button>
            ))}
          </div>

          {filteredRequests.map((item) => (
            <article key={item.id} className="panel stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <p className="muted" style={{ margin: '0 0 0.25rem', fontSize: '0.85rem' }}>
                    {categoryMap.get(item.categoryId) ?? 'Kategori'}
                  </p>
                  <h3 style={{ margin: 0 }}>
                    <Link to={`/talepler/${item.id}`}>#{item.id.slice(0, 8)}</Link>
                  </h3>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {new Date(item.createdAtUtc).toLocaleString('tr-TR')}
                  </p>
                </div>
                <span className={requestStatusBadgeClass(item.status)}>
                  {requestStatusLabel(item.status)}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <Link
                  className="btn btn-ghost"
                  to={`/talepler/${item.id}`}
                  style={{ padding: '0.55rem 0.95rem' }}
                >
                  Yazışma
                </Link>
                {item.status === 'Pending' ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busyId === item.id}
                    onClick={() =>
                      void run(
                        item.id,
                        () =>
                          apiFetch(
                            `/api/v1/citizen-requests/${item.id}/under-review`,
                            { method: 'POST' },
                            true,
                          ),
                        'İncelemeye alındı.',
                      )
                    }
                  >
                    İncelemeye al
                  </button>
                ) : null}
                {item.status === 'Pending' || item.status === 'UnderReview' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyId === item.id}
                    onClick={() =>
                      void run(
                        item.id,
                        () =>
                          apiFetch(
                            `/api/v1/citizen-requests/${item.id}/resolve`,
                            { method: 'POST' },
                            true,
                          ),
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
                    disabled={busyId === item.id}
                    onClick={() =>
                      void run(
                        item.id,
                        () =>
                          apiFetch(
                            `/api/v1/citizen-requests/${item.id}/close`,
                            { method: 'POST' },
                            true,
                          ),
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
          {filteredRequests.length === 0 ? (
            <div className="panel stack">
              <h3 style={{ margin: 0 }}>Bu görünümde talep yok</h3>
              <p className="muted" style={{ margin: 0 }}>
                Vatandaş hesabıyla örnek talep açıp burada değerlendirebilirsiniz.
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="stack">
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.35rem' }}>
            Sosyal yardım kuyruğu
          </h2>

          <div className="request-stats" aria-label="Başvuru özeti">
            <button
              type="button"
              className={aidFilter === 'all' ? 'is-active' : ''}
              onClick={() => setAidFilter('all')}
            >
              <strong>{aidCounts.all}</strong>
              <span className="muted">Tümü</span>
            </button>
            {Object.keys(aidStatusLabels).map((status) => (
              <button
                key={status}
                type="button"
                className={aidFilter === status ? 'is-active' : ''}
                onClick={() => setAidFilter(status)}
              >
                <strong>{aidCounts[status] ?? 0}</strong>
                <span className="muted">{aidStatusLabels[status]}</span>
              </button>
            ))}
          </div>

          {filteredAid.map((app) => (
            <article key={app.id} className="panel stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{aidTypeLabels[app.type] ?? app.type}</h3>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {app.householdSize} kişi · ₺{app.monthlyIncome.toFixed(0)} ·{' '}
                    {new Date(app.submittedAtUtc).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <span className={aidBadge(app.status)}>
                  {aidStatusLabels[app.status] ?? app.status}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{app.householdSummary}</p>
              {app.reviewNote ? <p className="muted">Not: {app.reviewNote}</p> : null}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {app.status === 'Submitted' ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busyId === app.id}
                    onClick={() =>
                      void run(
                        app.id,
                        () =>
                          apiFetch(
                            `/api/v1/social-assistance/${app.id}/start-review`,
                            { method: 'POST' },
                            true,
                          ),
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
                      disabled={busyId === app.id}
                      onClick={() =>
                        void run(
                          app.id,
                          () =>
                            apiFetch(
                              `/api/v1/social-assistance/${app.id}/decide`,
                              {
                                method: 'POST',
                                body: JSON.stringify({ approve: true, note: 'Uygun görüldü' }),
                              },
                              true,
                            ),
                          'Başvuru onaylandı.',
                        )
                      }
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={busyId === app.id}
                      onClick={() =>
                        void run(
                          app.id,
                          () =>
                            apiFetch(
                              `/api/v1/social-assistance/${app.id}/decide`,
                              {
                                method: 'POST',
                                body: JSON.stringify({
                                  approve: false,
                                  note: 'Kriterler sağlanmadı',
                                }),
                              },
                              true,
                            ),
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
          {filteredAid.length === 0 ? (
            <div className="panel stack">
              <h3 style={{ margin: 0 }}>Bu görünümde başvuru yok</h3>
              <p className="muted" style={{ margin: 0 }}>
                Vatandaş hesabıyla `/yardim` üzerinden örnek başvuru açabilirsiniz.
              </p>
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
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
