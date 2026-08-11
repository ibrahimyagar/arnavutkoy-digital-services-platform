import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  QuickActions,
  RecentActivity,
  ServiceStatus,
  SummaryCards,
  money,
  type ActivityItem,
  type QuickItem,
  type StatusItem,
  type SummaryItem,
} from '../components/dashboard/DashboardWidgets'
import {
  apiFetch,
  type Announcement,
  type CitizenRequestSummary,
  type Debt,
  type Neighborhood,
  type Paginated,
  type SocialAssistanceApplication,
  type TransportCard,
  type WaterSubscription,
} from '../lib/api'
import { isAdmin, isStaff } from '../lib/roles'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/giris" replace />
  return children
}

function requestStatusLabel(status: string) {
  switch (status) {
    case 'Pending':
      return 'Bekliyor'
    case 'UnderReview':
      return 'İncelemede'
    case 'Resolved':
      return 'Çözüldü'
    case 'Closed':
      return 'Kapandı'
    default:
      return status
  }
}

function debtTypeLabel(type: string) {
  switch (type) {
    case 'Water':
      return 'Su borcu'
    case 'Property':
      return 'Emlak borcu'
    default:
      return type
  }
}

type CitizenData = {
  openDebts: number
  debtTotal: number
  openRequests: number
  balance: number
  aidOpen: number
  recentDebts: Debt[]
  recentRequests: CitizenRequestSummary[]
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

  const [citizen, setCitizen] = useState<CitizenData | null>(null)
  const [staffData, setStaffData] = useState<StaffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCitizen() {
      const [debts, requests, cards, aid] = await Promise.all([
        apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true),
        apiFetch<Paginated<CitizenRequestSummary>>(
          '/api/v1/citizen-requests/mine?pageSize=50',
          {},
          true,
        ),
        apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
        apiFetch<Paginated<SocialAssistanceApplication>>(
          '/api/v1/social-assistance/mine?pageSize=50',
          {},
          true,
        ),
      ])

      const openDebts = debts.items.filter((d) => d.status !== 'Paid')
      const openRequests = requests.items.filter(
        (r) => r.status === 'Pending' || r.status === 'UnderReview',
      )

      return {
        openDebts: openDebts.length,
        debtTotal: openDebts.reduce((sum, d) => sum + d.totalPayable, 0),
        openRequests: openRequests.length,
        balance: cards.reduce((sum, c) => sum + c.balance, 0),
        aidOpen: aid.items.filter(
          (a) => a.status === 'Submitted' || a.status === 'UnderReview',
        ).length,
        recentDebts: [...debts.items]
          .sort((a, b) => +new Date(b.dueDateUtc) - +new Date(a.dueDateUtc))
          .slice(0, 4),
        recentRequests: [...requests.items]
          .sort((a, b) => +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc))
          .slice(0, 4),
      } satisfies CitizenData
    }

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
    void (staff ? loadStaff() : loadCitizen())
      .then((snap) => {
        if (cancelled) return
        if (staff) setStaffData(snap as StaffData)
        else setCitizen(snap as CitizenData)
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
  }, [staff, admin])

  const summaryItems = useMemo((): SummaryItem[] => {
    if (staff) {
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
    }

    const snap = citizen
    return [
      {
        id: 'debts',
        label: 'Açık borç',
        value: snap ? String(snap.openDebts) : '—',
        tone: snap && snap.openDebts > 0 ? 'warn' : 'ok',
      },
      {
        id: 'payable',
        label: 'Ödenecek',
        value: snap ? money(snap.debtTotal) : '—',
        tone: snap && snap.debtTotal > 0 ? 'warn' : 'default',
      },
      {
        id: 'requests',
        label: 'Açık talep',
        value: snap ? String(snap.openRequests) : '—',
        tone: snap && snap.openRequests > 0 ? 'warn' : 'ok',
      },
      {
        id: 'balance',
        label: 'Kart bakiyesi',
        value: snap ? money(snap.balance) : '—',
      },
    ]
  }, [staff, admin, citizen, staffData])

  const statusItems = useMemo((): StatusItem[] => {
    if (staff) {
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
    }

    const snap = citizen
    if (!snap) return []
    return [
      {
        id: 'debt',
        title: snap.openDebts > 0 ? 'Ödenmemiş borcunuz var' : 'Borç durumunuz temiz',
        detail:
          snap.openDebts > 0
            ? `${snap.openDebts} kayıt · ${money(snap.debtTotal)}`
            : 'Açık borç bulunmuyor',
        to: snap.openDebts > 0 ? '/borclar' : '/vezne',
        tone: snap.openDebts > 0 ? 'warn' : 'ok',
      },
      {
        id: 'req',
        title: snap.openRequests > 0 ? 'Devam eden hizmet talebiniz var' : 'Aktif talep yok',
        detail:
          snap.openRequests > 0
            ? `${snap.openRequests} talep süreçte`
            : 'Yeni talep oluşturabilirsiniz',
        to: '/talepler',
        tone: snap.openRequests > 0 ? 'warn' : 'default',
      },
      {
        id: 'aid',
        title: snap.aidOpen > 0 ? 'Sosyal yardım başvurunuz inceleniyor' : 'Sosyal yardım',
        detail:
          snap.aidOpen > 0
            ? `${snap.aidOpen} başvuru takipte`
            : 'İhtiyaç halinde başvuru yapabilirsiniz',
        to: '/yardim',
        tone: snap.aidOpen > 0 ? 'warn' : 'default',
      },
    ]
  }, [staff, citizen, staffData])

  const activityItems = useMemo((): ActivityItem[] => {
    if (staff) {
      return (staffData?.recentRequests ?? []).map((r) => ({
        id: r.id,
        title: `Talep · ${requestStatusLabel(r.status)}`,
        meta: new Date(r.createdAtUtc).toLocaleString('tr-TR'),
        to: `/talepler/${r.id}`,
      }))
    }

    const fromRequests = (citizen?.recentRequests ?? []).map((r) => ({
      id: `r-${r.id}`,
      title: `Hizmet talebi · ${requestStatusLabel(r.status)}`,
      meta: new Date(r.createdAtUtc).toLocaleString('tr-TR'),
      to: `/talepler/${r.id}`,
      sort: +new Date(r.createdAtUtc),
    }))
    const fromDebts = (citizen?.recentDebts ?? []).map((d) => ({
      id: `d-${d.id}`,
      title: `${debtTypeLabel(d.type)} · ${d.status === 'Paid' ? 'Ödendi' : 'Açık'}`,
      meta: `${money(d.totalPayable)} · vade ${new Date(d.dueDateUtc).toLocaleDateString('tr-TR')}`,
      to: '/borclar',
      sort: +new Date(d.dueDateUtc),
    }))

    return [...fromRequests, ...fromDebts]
      .sort((a, b) => b.sort - a.sort)
      .slice(0, 5)
      .map(({ sort: _sort, ...rest }) => rest)
  }, [staff, citizen, staffData])

  const quickItems = useMemo((): QuickItem[] => {
    if (staff) {
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
    }

    return [
      { id: 'cash', title: 'Dijital vezne', description: 'Borç öde / bakiye yükle', to: '/vezne' },
      { id: 'req', title: 'Hizmet masası', description: 'Talep oluştur / takip', to: '/talepler' },
      { id: 'docs', title: 'Belge başvurusu', description: 'İkametgâh ve belgeler', to: '/basvurular' },
      { id: 'eb', title: 'E-Belediye', description: 'Nikah, imar, spor', to: '/e-belediye' },
      { id: 'card', title: 'Ulaşım kartı', description: 'Bakiye ve biniş', to: '/ulasim' },
      { id: 'settings', title: 'Hesap ayarları', description: 'Profil ve parola', to: '/ayarlar' },
    ]
  }, [staff, admin])

  return (
    <div className="container dash-page">
      <header className="dash-hero">
        <h1>Merhaba, {user?.fullName}</h1>
        <p className="muted">
          {admin
            ? 'Yönetim paneli — kuyruklar ve operasyon özeti'
            : staff
              ? 'Personel paneli — bekleyen işler ve hızlı erişim'
              : 'Vatandaş paneli — borç, talep ve hizmet özeti'}
        </p>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <SummaryCards items={summaryItems} loading={loading} />

      <div className="dash-layout">
        <ServiceStatus items={loading ? [] : statusItems} />
        <RecentActivity
          items={activityItems}
          loading={loading}
          emptyText={staff ? 'Henüz listelenecek talep yok.' : 'Henüz işlem kaydı yok.'}
        />
      </div>

      <QuickActions items={quickItems} />

      {!staff ? (
        <p className="muted" style={{ margin: 0, fontSize: '0.88rem' }}>
          Tüm hizmetler için <Link to="/e-belediye">E-Belediye</Link> veya{' '}
          <Link to="/">ana sayfa</Link> kataloğuna bakabilirsiniz.
        </p>
      ) : null}
    </div>
  )
}
