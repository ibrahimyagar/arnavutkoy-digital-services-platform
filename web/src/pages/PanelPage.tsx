import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  apiFetch,
  type Announcement,
  type CitizenProperty,
  type CitizenRequestSummary,
  type Debt,
  type District,
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

type PanelLink = {
  to: string
  title: string
  description: string
  meta?: string
  highlight?: boolean
}

type CitizenSnapshot = {
  openDebts: number
  debtTotal: number
  openRequests: number
  cards: number
  balance: number
  properties: number
  water: number
  aidOpen: number
}

type StaffSnapshot = {
  openRequests: number
  aidQueue: number
  draftAnnouncements: number
  activeWater: number
  districts?: number
  neighborhoods?: number
}

function money(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

function PanelLinks({ links }: { links: PanelLink[] }) {
  return (
    <div className="panel-link-grid">
      {links.map((link) => (
        <Link
          key={link.to + link.title}
          className={`panel panel-link${link.highlight ? ' is-highlight' : ''}`}
          to={link.to}
        >
          <h3>{link.title}</h3>
          <p className="muted">{link.description}</p>
          {link.meta ? <strong className="panel-link-meta">{link.meta}</strong> : null}
        </Link>
      ))}
    </div>
  )
}

function StatsSkeleton({ label }: { label: string }) {
  return (
    <div className="stats-strip stats-strip--skeleton" aria-busy="true" aria-label={label}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index}>
          <span className="skeleton-line skeleton-line--sm" />
          <span className="skeleton-line skeleton-line--lg" />
        </div>
      ))}
    </div>
  )
}

function CitizenOps({ snapshot, loading }: { snapshot: CitizenSnapshot | null; loading: boolean }) {
  if (loading || !snapshot) {
    return <StatsSkeleton label="Vatandaş özeti yükleniyor" />
  }

  return (
    <div className="stats-strip" aria-label="Vatandaş özeti">
      <div>
        <span className="muted">Açık borç</span>
        <strong>{snapshot.openDebts}</strong>
      </div>
      <div>
        <span className="muted">Ödenecek</span>
        <strong>{money(snapshot.debtTotal)}</strong>
      </div>
      <div>
        <span className="muted">Açık talep</span>
        <strong>{snapshot.openRequests}</strong>
      </div>
      <div>
        <span className="muted">Kart bakiyesi</span>
        <strong>{money(snapshot.balance)}</strong>
      </div>
    </div>
  )
}

function StaffOps({
  snapshot,
  loading,
  admin,
}: {
  snapshot: StaffSnapshot | null
  loading: boolean
  admin: boolean
}) {
  if (loading || !snapshot) {
    return <StatsSkeleton label="Operasyon özeti yükleniyor" />
  }

  return (
    <div className="stats-strip" aria-label="Operasyon özeti">
      <div>
        <span className="muted">Açık talep</span>
        <strong>{snapshot.openRequests}</strong>
      </div>
      <div>
        <span className="muted">Yardım kuyruğu</span>
        <strong>{snapshot.aidQueue}</strong>
      </div>
      <div>
        <span className="muted">Taslak duyuru</span>
        <strong>{snapshot.draftAnnouncements}</strong>
      </div>
      <div>
        <span className="muted">{admin ? 'Mahalle' : 'Aktif su'}</span>
        <strong>
          {admin ? (snapshot.neighborhoods ?? 0) : snapshot.activeWater}
        </strong>
      </div>
    </div>
  )
}

export function PanelPage() {
  const { user } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)

  const [citizenSnap, setCitizenSnap] = useState<CitizenSnapshot | null>(null)
  const [staffSnap, setStaffSnap] = useState<StaffSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCitizen() {
      const [debts, requests, cards, properties, water, aid] = await Promise.all([
        apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true),
        apiFetch<Paginated<CitizenRequestSummary>>(
          '/api/v1/citizen-requests/mine?pageSize=50',
          {},
          true,
        ),
        apiFetch<TransportCard[]>('/api/v1/transport-cards/mine', {}, true),
        apiFetch<Paginated<CitizenProperty>>('/api/v1/properties/mine?pageSize=50', {}, true),
        apiFetch<Paginated<WaterSubscription>>(
          '/api/v1/water-subscriptions/mine?pageSize=50',
          {},
          true,
        ),
        apiFetch<Paginated<SocialAssistanceApplication>>(
          '/api/v1/social-assistance/mine?pageSize=50',
          {},
          true,
        ),
      ])

      const openDebts = debts.items.filter((d) => d.status !== 'Paid')
      const openRequests = requests.items.filter(
        (r) => r.status === 'Pending' || r.status === 'UnderReview',
      ).length
      const aidOpen = aid.items.filter(
        (a) => a.status === 'Submitted' || a.status === 'UnderReview',
      ).length

      return {
        openDebts: openDebts.length,
        debtTotal: openDebts.reduce((sum, d) => sum + d.totalPayable, 0),
        openRequests,
        cards: cards.length,
        balance: cards.reduce((sum, c) => sum + c.balance, 0),
        properties: properties.items.filter((p) => p.isActive).length,
        water: water.items.filter((w) => w.status === 'Active').length,
        aidOpen,
      } satisfies CitizenSnapshot
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

      let districts = 0
      let neighborhoods = 0
      if (admin) {
        const [districtList, neighborhoodList] = await Promise.all([
          apiFetch<District[]>('/api/v1/districts'),
          apiFetch<Neighborhood[]>('/api/v1/neighborhoods'),
        ])
        districts = districtList.length
        neighborhoods = neighborhoodList.length
      }

      return {
        openRequests: requests.items.filter(
          (r) => r.status === 'Pending' || r.status === 'UnderReview',
        ).length,
        aidQueue: aid.items.filter(
          (a) => a.status === 'Submitted' || a.status === 'UnderReview',
        ).length,
        draftAnnouncements: announcements.items.filter((a) => a.status === 'Draft').length,
        activeWater: water.totalCount || water.items.length,
        districts,
        neighborhoods,
      } satisfies StaffSnapshot
    }

    setLoading(true)
    setError(null)
    void (staff ? loadStaff() : loadCitizen())
      .then((snap) => {
        if (cancelled) return
        if (staff) setStaffSnap(snap as StaffSnapshot)
        else setCitizenSnap(snap as CitizenSnapshot)
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

  const citizenLinks = useMemo((): PanelLink[] => {
    const snap = citizenSnap
    return [
      {
        to: '/vezne',
        title: 'Dijital vezne',
        description: 'Borç ödeme ve bakiye yükleme hub’ı',
        meta: snap ? `${snap.openDebts} açık borç` : undefined,
        highlight: Boolean(snap && snap.openDebts > 0),
      },
      {
        to: '/borclar',
        title: 'Borçlarım',
        description: 'Ödeme ve gecikme faizini görüntüle',
        meta: snap ? money(snap.debtTotal) : undefined,
        highlight: Boolean(snap && snap.debtTotal > 0),
      },
      {
        to: '/talepler',
        title: 'Taleplerim',
        description: 'Hizmet masası kayıtları',
        meta: snap ? `${snap.openRequests} açık` : undefined,
        highlight: Boolean(snap && snap.openRequests > 0),
      },
      {
        to: '/ulasim',
        title: 'Ulaşım kartım',
        description: 'Bakiye ve biniş işlemleri',
        meta: snap ? `${snap.cards} kart · ${money(snap.balance)}` : undefined,
      },
      {
        to: '/binis',
        title: 'Biniş simülasyonu',
        description: 'Hat → kart → bin',
      },
      {
        to: '/mulkler',
        title: 'Mülklerim',
        description: 'Mahalle bazlı kayıtlar',
        meta: snap ? `${snap.properties} aktif` : undefined,
      },
      {
        to: '/su',
        title: 'Su aboneliği',
        description: 'Abone no ve durum',
        meta: snap ? `${snap.water} aktif` : undefined,
      },
      {
        to: '/yardim',
        title: 'Sosyal yardım',
        description: 'Başvuru ve durum takibi',
        meta: snap ? `${snap.aidOpen} süreçte` : undefined,
        highlight: Boolean(snap && snap.aidOpen > 0),
      },
      {
        to: '/muhtarliklar',
        title: 'Muhtarlıklar',
        description: 'Mahalle ve muhtar dizini',
      },
      {
        to: '/ayarlar',
        title: 'Hesap ayarları',
        description: 'Profil, telefon ve parola',
      },
    ]
  }, [citizenSnap])

  const staffLinks = useMemo((): PanelLink[] => {
    const snap = staffSnap
    const base: PanelLink[] = [
      {
        to: '/personel',
        title: 'Personel masası',
        description: 'Talep ve sosyal yardım değerlendirme',
        meta: snap
          ? `${snap.openRequests} talep · ${snap.aidQueue} yardım`
          : undefined,
        highlight: Boolean(snap && (snap.openRequests > 0 || snap.aidQueue > 0)),
      },
      {
        to: '/su-yonetimi',
        title: 'Su yönetimi',
        description: 'Abonelik durumu ve borç kesme',
        meta: snap ? `${snap.activeWater} aktif abone` : undefined,
      },
      {
        to: '/mulk-yonetimi',
        title: 'Mülk yönetimi',
        description: 'Emlak vergisi borcu kesme',
      },
      {
        to: '/duyuru-yonetimi',
        title: 'Duyuru yönetimi',
        description: 'Taslak, yayın ve arşiv',
        meta: snap ? `${snap.draftAnnouncements} taslak` : undefined,
        highlight: Boolean(snap && snap.draftAnnouncements > 0),
      },
      {
        to: '/talepler',
        title: 'Talepler',
        description: 'Tüm hizmet talepleri',
        meta: snap ? `${snap.openRequests} açık` : undefined,
      },
      {
        to: '/ayarlar',
        title: 'Hesap ayarları',
        description: 'Profil, telefon ve parola',
      },
    ]

    if (!admin) return base

    return [
      {
        to: '/cografya',
        title: 'Coğrafya',
        description: 'İlçe, mahalle ve sokak yönetimi',
        meta: snap
          ? `${snap.districts ?? 0} ilçe · ${snap.neighborhoods ?? 0} mahalle`
          : undefined,
      },
      {
        to: '/hat-yonetimi',
        title: 'Hat yönetimi',
        description: 'Hat, durak ve hareket saatleri',
      },
      {
        to: '/birim-yonetimi',
        title: 'Birim yönetimi',
        description: 'Departman ve dizin personeli',
      },
      ...base,
    ]
  }, [staffSnap, admin])

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Merhaba, {user?.fullName}</h1>
        <p className="muted">
          {admin
            ? 'Yönetici paneli — kuyruklar ve coğrafya özeti canlıdır.'
            : staff
              ? 'Personel paneli — bekleyen talep ve yardım sayıları canlıdır.'
              : 'Vatandaş paneli — borç, talep ve kart bakiyeniz özetlenir.'}
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      {staff ? (
        <StaffOps snapshot={staffSnap} loading={loading} admin={admin} />
      ) : (
        <CitizenOps snapshot={citizenSnap} loading={loading} />
      )}

      {loading ? (
        <div className="notice notice--skeleton" aria-live="polite">
          <span className="skeleton-line skeleton-line--xl" />
        </div>
      ) : null}

      {!loading && !staff && citizenSnap && citizenSnap.openDebts > 0 ? (
        <div className="notice">
          Ödenecek {money(citizenSnap.debtTotal)} tutarında açık borcunuz var.{' '}
          <Link to="/borclar">Borçlara git</Link>
        </div>
      ) : null}

      {!loading &&
      staff &&
      staffSnap &&
      (staffSnap.openRequests > 0 || staffSnap.aidQueue > 0) ? (
        <div className="notice">
          Masada {staffSnap.openRequests} açık talep ve {staffSnap.aidQueue} yardım başvurusu
          bekliyor. <Link to="/personel">Personel masasına git</Link>
        </div>
      ) : null}

      <PanelLinks links={staff ? staffLinks : citizenLinks} />
    </div>
  )
}
