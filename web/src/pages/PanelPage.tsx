import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  QuickActions,
  RecentActivity,
  ServiceStatus,
  SummaryCards,
  type ActivityItem,
  type QuickItem,
  type StatusItem,
  type SummaryItem,
} from '../components/dashboard/DashboardWidgets'
import {
  apiFetch,
  type Announcement,
  type CitizenRequestSummary,
  type Neighborhood,
  type Paginated,
  type SocialAssistanceApplication,
  type WaterSubscription,
} from '../lib/api'
import { isAdmin, isStaff } from '../lib/roles'
import { requestStatusLabel } from '../lib/requestStatus'
import { loginPath } from '../lib/returnUrl'
import { CitizenHub } from './CitizenHub'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />
  }
  return children
}

type StaffData = {
  openRequests: number
  aidQueue: number
  draftAnnouncements: number
  activeWater: number
  neighborhoods: number
  recentRequests: CitizenRequestSummary[]
}

export function PanelPage() {
  const { user } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)

  if (!staff) return <CitizenHub />

  return <StaffPanel admin={admin} />
}

function StaffPanel({ admin }: { admin: boolean }) {
  const { user } = useAuth()
  const [staffData, setStaffData] = useState<StaffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStaff() {
      const [requests, aid, announcements, water] = await Promise.all([
        apiFetch<Paginated<CitizenRequestSummary>>(
          '/api/v1/citizen-requests?pageSize=100',
          {},
          true,
        ),
        apiFetch<Paginated<SocialAssistanceApplication>>(
          '/api/v1/social-assistance?pageSize=100',
          {},
          true,
        ),
        apiFetch<Paginated<Announcement>>(
          '/api/v1/announcements/managed?pageSize=100',
          {},
          true,
        ),
        apiFetch<Paginated<WaterSubscription>>(
          '/api/v1/water-subscriptions?pageSize=100&status=Active',
          {},
          true,
        ),
      ])

      let neighborhoods = 0
      if (admin) {
        const neighborhoodList = await apiFetch<Neighborhood[]>('/api/v1/neighborhoods')
        neighborhoods = neighborhoodList.length
      }

      const openRequests = requests.items.filter(
        (r) => r.status === 'Pending' || r.status === 'UnderReview',
      )

      return {
        openRequests: openRequests.length,
        aidQueue: aid.items.filter(
          (a) => a.status === 'Submitted' || a.status === 'UnderReview',
        ).length,
        draftAnnouncements: announcements.items.filter((a) => a.status === 'Draft').length,
        activeWater: water.totalCount || water.items.length,
        neighborhoods,
        recentRequests: [...requests.items]
          .sort((a, b) => +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc))
          .slice(0, 5),
      } satisfies StaffData
    }

    setLoading(true)
    setError(null)
    void loadStaff()
      .then((snap) => {
        if (cancelled) return
        setStaffData(snap)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Panel özeti yüklenemedi.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [admin])

  const summaryItems = useMemo((): SummaryItem[] => {
    const snap = staffData
    return [
      {
        id: 'req',
        label: 'Açık talep',
        value: snap ? String(snap.openRequests) : '—',
        tone: snap && snap.openRequests > 0 ? 'warn' : 'default',
      },
      {
        id: 'aid',
        label: 'Yardım kuyruğu',
        value: snap ? String(snap.aidQueue) : '—',
        tone: snap && snap.aidQueue > 0 ? 'warn' : 'default',
      },
      {
        id: 'draft',
        label: 'Taslak duyuru',
        value: snap ? String(snap.draftAnnouncements) : '—',
      },
      {
        id: 'extra',
        label: admin ? 'Mahalle' : 'Aktif su',
        value: snap ? String(admin ? snap.neighborhoods : snap.activeWater) : '—',
      },
    ]
  }, [admin, staffData])

  const statusItems = useMemo((): StatusItem[] => {
    const snap = staffData
    if (!snap) return []
    const items: StatusItem[] = [
      {
        id: 'queue',
        title: snap.openRequests > 0 ? 'Bekleyen hizmet talepleri var' : 'Talep kuyruğu sakin',
        detail:
          snap.openRequests > 0
            ? `${snap.openRequests} talep inceleme bekliyor`
            : 'Açık talep bulunmuyor',
        to: '/personel',
        tone: snap.openRequests > 0 ? 'warn' : 'ok',
      },
      {
        id: 'aid',
        title: snap.aidQueue > 0 ? 'Sosyal yardım başvuruları bekliyor' : 'Yardım kuyruğu boş',
        detail:
          snap.aidQueue > 0
            ? `${snap.aidQueue} başvuru değerlendirme bekliyor`
            : 'Yeni başvuru yok',
        to: '/personel',
        tone: snap.aidQueue > 0 ? 'warn' : 'ok',
      },
    ]
    if (snap.draftAnnouncements > 0) {
      items.push({
        id: 'ann',
        title: 'Yayımlanmayı bekleyen duyurular',
        detail: `${snap.draftAnnouncements} taslak duyuru`,
        to: '/duyuru-yonetimi',
        tone: 'warn',
      })
    }
    return items
  }, [staffData])

  const activityItems = useMemo((): ActivityItem[] => {
    return (staffData?.recentRequests ?? []).map((r) => ({
      id: r.id,
      title: `Talep · ${requestStatusLabel(r.status)}`,
      meta: new Date(r.createdAtUtc).toLocaleString('tr-TR'),
      to: `/talepler/${r.id}`,
    }))
  }, [staffData])

  const quickItems = useMemo((): QuickItem[] => {
    const items: QuickItem[] = [
      { id: 'desk', title: 'Personel masası', description: 'Talep ve yardım', to: '/personel' },
      { id: 'ann', title: 'Duyurular', description: 'Taslak / yayın', to: '/duyuru-yonetimi' },
      { id: 'water', title: 'Su yönetimi', description: 'Abone ve borç', to: '/su-yonetimi' },
      { id: 'prop', title: 'Mülk yönetimi', description: 'Emlak vergisi', to: '/mulk-yonetimi' },
      { id: 'settings', title: 'Hesap', description: 'Profil ve parola', to: '/ayarlar' },
    ]
    if (admin) {
      items.unshift(
        { id: 'geo', title: 'Coğrafya', description: 'Mahalle / sokak', to: '/cografya' },
        { id: 'lines', title: 'Hat yönetimi', description: 'Ulaşım hatları', to: '/hat-yonetimi' },
      )
    }
    return items.slice(0, 6)
  }, [admin])

  return (
    <div className="container dash-page">
      <header className="dash-hero">
        <h1>Merhaba, {user?.fullName}</h1>
        <p className="muted">
          {admin
            ? 'Yönetim paneli — kuyruklar ve operasyon özeti'
            : 'Personel paneli — bekleyen işler ve hızlı erişim'}
        </p>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <SummaryCards items={summaryItems} loading={loading} />

      <div className="dash-layout">
        <ServiceStatus items={loading ? [] : statusItems} />
        <RecentActivity
          items={activityItems}
          loading={loading}
          emptyText="Henüz listelenecek talep yok."
        />
      </div>

      <QuickActions items={quickItems} />
    </div>
  )
}
