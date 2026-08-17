import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { money } from '../components/dashboard/DashboardWidgets'
import {
  apiFetch,
  type Announcement,
  type BoardingRecord,
  type BusLine,
  type CitizenRequestSummary,
  type ContactMessageSummary,
  type Debt,
  type DocumentApplication,
  type EventRegistration,
  type Paginated,
  type RequestCategory,
  type SocialAssistanceApplication,
  type SportsAppointment,
  type TransportCard,
  type UserProfile,
} from '../lib/api'
import { parseLineSummary } from '../lib/busLineVisuals'
import { contactStatusLabel } from '../lib/contactCenter'
import { readFavoriteLineIds, toggleFavoriteLine } from '../lib/transportFavorites'
import { readReceipts } from '../lib/transportReceipts'
import { requestStatusLabel } from '../lib/requestStatus'
import {
  loadNotifyPrefs,
  loadReadNoticeIds,
  saveReadNoticeIds,
  type NotifyKind,
} from '../lib/hubNotices'
import './citizen-hub.css'

const LAST_SEEN_KEY = 'arnavutkoy.hub.lastSeen'
const FAV_KEY = 'arnavutkoy.hub.favs'
const DEFAULT_FAVS = ['vezne', 'talepler', 'basvurular']

type Tone = 'ok' | 'warn' | 'info' | 'muted'

type Lane = {
  id: string
  title: string
  status: string
  detail: string
  date: string | null
  to: string
  action: string
  tone: Tone
}

type TimelineRow = {
  id: string
  icon: IconName
  title: string
  detail: string
  date: string
  status: string
  tone: Tone
  sort: number
  to: string
}

type UpcomingRow = {
  id: string
  day: string
  title: string
  status: string
  action: string
  to: string
  kind: string
  tone: Tone
}

type HubNotice = {
  id: string
  kind: NotifyKind
  kindLabel: string
  title: string
  detail: string
  to: string
}

type ServiceDef = {
  id: string
  title: string
  blurb: string
  to: string
  action: string
  icon: IconName
}

const SERVICES: ServiceDef[] = [
  {
    id: 'vezne',
    title: 'Dijital vezne',
    blurb: 'Borç sorgula ve ödeme yap',
    to: '/vezne',
    action: 'Öde',
    icon: 'wallet',
  },
  {
    id: 'basvurular',
    title: 'Belge başvurusu',
    blurb: 'Online belge talebi oluştur',
    to: '/basvurular',
    action: 'Başvur',
    icon: 'file',
  },
  {
    id: 'talepler',
    title: 'Talep oluştur',
    blurb: 'Belediyeye bildir',
    to: '/talepler',
    action: 'Oluştur',
    icon: 'megaphone',
  },
  {
    id: 'etkinliklerim',
    title: 'Etkinliklerim',
    blurb: 'Kayıt ve katılım takvimi',
    to: '/etkinliklerim',
    action: 'Gör',
    icon: 'calendar',
  },
  {
    id: 'ulasim',
    title: 'Ulaşım kartı',
    blurb: 'Bakiye gör, biniş kaydı tut',
    to: '/ulasim',
    action: 'Kartım',
    icon: 'card',
  },
  {
    id: 'yardim',
    title: 'Sosyal yardım',
    blurb: 'Başvuru oluştur ve takip et',
    to: '/yardim',
    action: 'Başvur',
    icon: 'heart',
  },
]

async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(+date)) return null
  return date.toLocaleDateString('tr-TR')
}

function formatLongDay(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(+date)) return null
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function courtesyName(fullName: string, gender?: string) {
  const first = fullName.trim().split(/\s+/)[0] || 'Vatandaş'
  if (gender === 'K') return `${first} Hanım`
  if (gender === 'E') return `${first} Bey`
  return first
}

function initials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

function debtTypeLabel(type: string) {
  if (type === 'Water') return 'Su borcu'
  if (type === 'Property') return 'Emlak borcu'
  return type
}

function documentStatusLabel(status: string) {
  switch (status) {
    case 'Submitted':
      return 'Alındı'
    case 'InReview':
      return 'İncelemede'
    case 'Ready':
      return 'Hazır'
    case 'Rejected':
      return 'Reddedildi'
    case 'Closed':
      return 'Kapandı'
    default:
      return status
  }
}

function unpaid(debts: Debt[]) {
  return debts.filter((d) => d.status !== 'Paid')
}

function openRequestsOf(items: CitizenRequestSummary[]) {
  return items.filter((r) => r.status === 'Pending' || r.status === 'UnderReview')
}

function nearestDue(items: Debt[]) {
  return [...items].sort((a, b) => +new Date(a.dueDateUtc) - +new Date(b.dueDateUtc))[0] ?? null
}

function readLastSeen(userId: string) {
  const storeKey = `${LAST_SEEN_KEY}.${userId}`
  const sessionKey = `${LAST_SEEN_KEY}.session.${userId}`
  try {
    const previousRaw = localStorage.getItem(storeKey)
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1')
      localStorage.setItem(storeKey, new Date().toISOString())
    }
    const previous = previousRaw ? new Date(previousRaw) : null
    return previous && !Number.isNaN(+previous) ? previous : null
  } catch {
    return null
  }
}

function readFavs(userId: string) {
  try {
    const raw = localStorage.getItem(`${FAV_KEY}.${userId}`)
    if (!raw) return [...DEFAULT_FAVS]
    const parsed = JSON.parse(raw) as string[]
    return parsed.filter((id) => SERVICES.some((s) => s.id === id))
  } catch {
    return [...DEFAULT_FAVS]
  }
}

function writeFavs(userId: string, ids: string[]) {
  localStorage.setItem(`${FAV_KEY}.${userId}`, JSON.stringify(ids))
}

type HubSnapshot = {
  debts: Debt[]
  requests: CitizenRequestSummary[]
  cards: TransportCard[]
  boardings: BoardingRecord[]
  lines: BusLine[]
  aid: SocialAssistanceApplication[]
  documents: DocumentApplication[]
  events: EventRegistration[]
  sports: SportsAppointment[]
  contacts: ContactMessageSummary[]
  announcements: Announcement[]
  categories: RequestCategory[]
  profile: UserProfile | null
}

export function CitizenHub() {
  const { user } = useAuth()
  const [data, setData] = useState<HubSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favs, setFavs] = useState<string[]>(() => (user ? readFavs(user.userId) : [...DEFAULT_FAVS]))
  const [lastSeen] = useState<Date | null>(() => (user ? readLastSeen(user.userId) : null))
  const [readIds, setReadIds] = useState<string[]>(() => (user ? loadReadNoticeIds(user.userId) : []))

  useEffect(() => {
    if (!user) return
    setReadIds(loadReadNoticeIds(user.userId))
  }, [user?.userId])

  useEffect(() => {
    let cancelled = false

    async function load() {
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

      const [documents, events, sports, announcements, categories, profile, boardings, lines, contacts] = await Promise.all([
        settle(apiFetch<DocumentApplication[]>('/api/v1/e-services/documents/mine', {}, true), []),
        settle(apiFetch<EventRegistration[]>('/api/v1/event-registrations/mine', {}, true), []),
        settle(apiFetch<SportsAppointment[]>('/api/v1/e-services/sports/mine', {}, true), []),
        settle(apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=4'), {
          items: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize: 4,
          totalPages: 0,
        }),
        settle(apiFetch<RequestCategory[]>('/api/v1/citizen-requests/categories'), []),
        settle(apiFetch<UserProfile>('/api/v1/auth/me', {}, true), null),
        settle(
          apiFetch<Paginated<BoardingRecord>>('/api/v1/transport-cards/mine/boardings?pageSize=8', {}, true),
          { items: [], totalCount: 0, pageNumber: 1, pageSize: 8, totalPages: 0 },
        ),
        settle(apiFetch<BusLine[]>('/api/v1/bus-lines'), []),
        settle(apiFetch<ContactMessageSummary[]>('/api/v1/e-services/contact/mine', {}, true), []),
      ])

      return {
        debts: debts.items,
        requests: requests.items,
        cards,
        boardings: boardings.items,
        lines,
        aid: aid.items,
        documents,
        events,
        sports,
        contacts,
        announcements: announcements.items,
        categories,
        profile,
      } satisfies HubSnapshot
    }

    setLoading(true)
    setError(null)
    void load()
      .then((snap) => {
        if (!cancelled) setData(snap)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Hizmet özeti yüklenemedi.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const categoryName = useMemo(() => {
    const map = new Map(data?.categories.map((c) => [c.id, c.name]) ?? [])
    return (id: string) => map.get(id) ?? 'Hizmet talebi'
  }, [data?.categories])

  const openDebts = unpaid(data?.debts ?? [])
  const propertyOpen = openDebts.filter((d) => d.type === 'Property')
  const waterOpen = openDebts.filter((d) => d.type === 'Water')
  const openReqs = openRequestsOf(data?.requests ?? [])
  const balance = (data?.cards ?? []).reduce((sum, c) => sum + c.balance, 0)
  const aidOpen = (data?.aid ?? []).filter(
    (a) => a.status === 'Submitted' || a.status === 'UnderReview',
  )
  const docsOpen = (data?.documents ?? []).filter(
    (d) => d.status === 'Submitted' || d.status === 'InReview',
  )
  const docsReady = (data?.documents ?? []).filter((d) => d.status === 'Ready')
  const now = Date.now()
  const eventsUpcoming = (data?.events ?? []).filter(
    (e) => e.status === 'Registered' && e.startsAtUtc && +new Date(e.startsAtUtc) >= now,
  )
  const sportsUpcoming = (data?.sports ?? []).filter(
    (s) => s.status === 'Booked' && +new Date(s.slotStartUtc) >= now,
  )

  const greeting = courtesyName(data?.profile?.fullName ?? user?.fullName ?? 'Vatandaş', data?.profile?.gender)
  const displayName = data?.profile?.fullName ?? user?.fullName ?? 'Vatandaş'

  const alerts = useMemo(() => {
    const items: { id: string; text: string; to: string }[] = []
    const soon = openDebts.filter((d) => {
      const due = +new Date(d.dueDateUtc)
      return due - now < 7 * 24 * 60 * 60 * 1000
    })
    if (soon.length > 0) {
      items.push({
        id: 'due',
        text: `${soon.length} borcunuzun vadesi 7 gün içinde`,
        to: '/vezne',
      })
    } else if (openDebts.length > 0) {
      const nearest = nearestDue(openDebts)
      items.push({
        id: 'due',
        text: `${debtTypeLabel(nearest?.type ?? 'Borç')} açık · ${money(openDebts.reduce((s, d) => s + d.totalPayable, 0))}`,
        to: '/vezne',
      })
    }
    if (docsReady.length > 0) {
      items.push({
        id: 'ready',
        text: `${docsReady.length} belgeniz teslime hazır`,
        to: '/basvurular',
      })
    }
    if (openReqs.length > 0) {
      items.push({
        id: 'req',
        text: `${openReqs.length} talebiniz süreçte`,
        to: '/talepler',
      })
    }
    return items.slice(0, 3)
  }, [openDebts, docsReady.length, openReqs.length, now])

  const failed = Boolean(error) && !loading

  const lanes: Lane[] = failed
    ? [
        {
          id: 'apps',
          title: 'Başvurularım',
          status: 'Bilinmiyor',
          detail: 'Özet alınamadı',
          date: null,
          to: '/basvurular',
          action: 'Gör',
          tone: 'muted',
        },
        {
          id: 'pay',
          title: 'Ödemelerim',
          status: 'Bilinmiyor',
          detail: 'Özet alınamadı',
          date: null,
          to: '/vezne',
          action: 'Vezne',
          tone: 'muted',
        },
        {
          id: 'req',
          title: 'Taleplerim',
          status: 'Bilinmiyor',
          detail: 'Özet alınamadı',
          date: null,
          to: '/talepler',
          action: 'Gör',
          tone: 'muted',
        },
        {
          id: 'apt',
          title: 'Randevularım',
          status: 'Bilinmiyor',
          detail: 'Özet alınamadı',
          date: null,
          to: '/etkinliklerim',
          action: 'Gör',
          tone: 'muted',
        },
        {
          id: 'docs',
          title: 'Belgelerim',
          status: 'Bilinmiyor',
          detail: 'Özet alınamadı',
          date: null,
          to: '/basvurular',
          action: 'Gör',
          tone: 'muted',
        },
      ]
    : [
    {
      id: 'apps',
      title: 'Başvurularım',
      status: aidOpen.length + docsOpen.length > 0 ? 'İşlem devam ediyor' : 'Bulunmuyor',
      detail:
        aidOpen.length + docsOpen.length > 0
          ? `${aidOpen.length + docsOpen.length} başvuru inceleniyor`
          : 'Bekleyen belge veya yardım başvurusu yok',
      date: aidOpen[0]?.submittedAtUtc ?? docsOpen[0]?.createdAtUtc ?? null,
      to: aidOpen.length > 0 ? '/yardim' : '/basvurular',
      action: 'Takip et',
      tone: aidOpen.length + docsOpen.length > 0 ? 'info' : 'muted',
    },
    {
      id: 'pay',
      title: 'Ödemelerim',
      status: openDebts.length > 0 ? 'Ödeme bekliyor' : 'Tamamlandı',
      detail:
        openDebts.length > 0
          ? `${openDebts.length} kayıt · ${money(openDebts.reduce((s, d) => s + d.totalPayable, 0))}`
          : 'Açık borcunuz bulunmuyor',
      date: nearestDue(openDebts)?.dueDateUtc ?? null,
      to: openDebts.length > 0 ? '/vezne' : '/borclar',
      action: openDebts.length > 0 ? 'Öde' : 'Gör',
      tone: openDebts.length > 0 ? 'warn' : 'ok',
    },
    {
      id: 'req',
      title: 'Taleplerim',
      status: openReqs.length > 0 ? 'İşlem devam ediyor' : 'Bulunmuyor',
      detail:
        openReqs.length > 0
          ? `${openReqs.length} talep belediyede`
          : 'Yeni talep oluşturabilirsiniz',
      date: openReqs[0]?.createdAtUtc ?? data?.requests[0]?.createdAtUtc ?? null,
      to: '/talepler',
      action: openReqs.length > 0 ? 'Takip et' : 'Oluştur',
      tone: openReqs.length > 0 ? 'info' : 'muted',
    },
    {
      id: 'apt',
      title: 'Randevularım',
      status: sportsUpcoming.length + eventsUpcoming.length > 0 ? 'İşlem devam ediyor' : 'Bulunmuyor',
      detail:
        sportsUpcoming.length + eventsUpcoming.length > 0
          ? `${sportsUpcoming.length + eventsUpcoming.length} yaklaşan kayıt`
          : 'Spor veya etkinlik kaydınız yok',
      date: sportsUpcoming[0]?.slotStartUtc ?? eventsUpcoming[0]?.startsAtUtc ?? null,
      to: sportsUpcoming.length > 0 ? '/spor-randevu' : '/etkinliklerim',
      action: 'Gör',
      tone: sportsUpcoming.length + eventsUpcoming.length > 0 ? 'info' : 'muted',
    },
    {
      id: 'docs',
      title: 'Belgelerim',
      status: docsReady.length > 0 ? 'Tamamlandı' : docsOpen.length > 0 ? 'İşlem devam ediyor' : 'Bulunmuyor',
      detail:
        docsReady.length > 0
          ? `${docsReady.length} belge teslime hazır`
          : docsOpen.length > 0
            ? `${docsOpen.length} başvuru süreçte`
            : 'İkametgâh ve resmi belge talep edin',
      date: docsReady[0]?.createdAtUtc ?? docsOpen[0]?.createdAtUtc ?? null,
      to: '/basvurular',
      action: docsReady.length > 0 ? 'Al' : 'Başvur',
      tone: docsReady.length > 0 ? 'ok' : docsOpen.length > 0 ? 'info' : 'muted',
    },
  ]

  const timeline: TimelineRow[] = useMemo(() => {
    if (!data) return []
    const rows: TimelineRow[] = []

    for (const d of data.debts) {
      const paid = d.status === 'Paid'
      rows.push({
        id: `d-${d.id}`,
        icon: d.type === 'Water' ? 'drop' : 'home',
        title: paid ? `${debtTypeLabel(d.type)} ödendi` : `${debtTypeLabel(d.type)} oluşturuldu`,
        detail: paid
          ? `${money(d.totalPayable)} tutarındaki kayıt kapatıldı`
          : `${money(d.totalPayable)} tutarında açık borç`,
        date: paid ? d.paidAtUtc ?? d.dueDateUtc : d.dueDateUtc,
        status: paid ? 'Tamamlandı' : 'Ödeme bekliyor',
        tone: paid ? 'ok' : 'warn',
        sort: +new Date(paid ? d.paidAtUtc ?? d.dueDateUtc : d.dueDateUtc),
        to: '/borclar',
      })
    }

    for (const r of data.requests) {
      const done = r.status === 'Resolved' || r.status === 'Closed'
      rows.push({
        id: `r-${r.id}`,
        icon: 'megaphone',
        title: categoryName(r.categoryId),
        detail: `Talep ${requestStatusLabel(r.status).toLowerCase()}`,
        date: r.resolvedAtUtc ?? r.createdAtUtc,
        status: done ? 'Tamamlandı' : 'İşlem devam ediyor',
        tone: done ? 'ok' : 'info',
        sort: +new Date(r.resolvedAtUtc ?? r.createdAtUtc),
        to: `/talepler/${r.id}`,
      })
    }

    for (const doc of data.documents) {
      const done = doc.status === 'Ready' || doc.status === 'Closed'
      rows.push({
        id: `doc-${doc.id}`,
        icon: 'file',
        title: doc.title,
        detail: `Belge başvurusu · ${documentStatusLabel(doc.status)}`,
        date: doc.createdAtUtc,
        status: done ? 'Tamamlandı' : 'İşlem devam ediyor',
        tone: done ? 'ok' : 'info',
        sort: +new Date(doc.createdAtUtc),
        to: '/basvurular',
      })
    }

    for (const ev of data.events) {
      const cancelled = ev.status === 'Cancelled'
      rows.push({
        id: `ev-${ev.id}`,
        icon: 'calendar',
        title: cancelled ? `${ev.eventTitle} kaydı iptal` : `${ev.eventTitle} kaydı alındı`,
        detail: ev.eventLocation ?? 'Etkinlik kaydı',
        date: ev.cancelledAtUtc ?? ev.registeredAtUtc,
        status: cancelled ? 'Bulunmuyor' : 'Tamamlandı',
        tone: cancelled ? 'muted' : 'ok',
        sort: +new Date(ev.cancelledAtUtc ?? ev.registeredAtUtc),
        to: '/etkinliklerim',
      })
    }

    const lineMap = new Map(data.lines.map((line) => [line.id, line]))
    for (const boarding of data.boardings) {
      const line = lineMap.get(boarding.busLineId)
      const parsed = line ? parseLineSummary(line.routeSummary) : null
      rows.push({
        id: `tx-${boarding.id}`,
        icon: 'card',
        title: line ? `${line.code} biniş` : 'Ulaşım binişi',
        detail: `${parsed?.route ?? line?.name ?? 'Simülasyon'} · ${money(boarding.fareCharged)}`,
        date: boarding.boardedAtUtc,
        status: 'Tamamlandı',
        tone: 'ok',
        sort: +new Date(boarding.boardedAtUtc),
        to: '/ulasim',
      })
    }

    for (const receipt of readReceipts().filter((item) => item.kind === 'topup').slice(0, 4)) {
      rows.push({
        id: `yuk-${receipt.id}`,
        icon: 'wallet',
        title: 'Kart bakiyesi yüklendi',
        detail: `${receipt.cardNumber} · ${money(receipt.amount)} (demo)`,
        date: receipt.createdAtUtc,
        status: 'Tamamlandı',
        tone: 'ok',
        sort: +new Date(receipt.createdAtUtc),
        to: '/ulasim',
      })
    }

    for (const msg of data.contacts) {
      const done = msg.status === 'Closed'
      rows.push({
        id: `cm-${msg.id}`,
        icon: 'megaphone',
        title: msg.subject,
        detail: `${msg.trackingCode} · ${contactStatusLabel(msg.status)}`,
        date: msg.createdAtUtc,
        status: done ? 'Tamamlandı' : 'İşlem devam ediyor',
        tone: done ? 'ok' : 'info',
        sort: +new Date(msg.createdAtUtc),
        to: `/basvuru-takip?kod=${encodeURIComponent(msg.trackingCode)}`,
      })
    }

    return rows.sort((a, b) => b.sort - a.sort).slice(0, 8)
  }, [data, categoryName])

  const upcoming: UpcomingRow[] = useMemo(() => {
    const rows: UpcomingRow[] = []
    for (const d of openDebts) {
      rows.push({
        id: `due-${d.id}`,
        day: formatLongDay(d.dueDateUtc) ?? '—',
        title: `${debtTypeLabel(d.type)} ödeme zamanı`,
        status: 'Ödeme bekliyor',
        action: 'Öde',
        to: '/vezne',
        kind: 'Ödeme',
        tone: 'warn',
      })
    }
    for (const s of sportsUpcoming) {
      rows.push({
        id: `sp-${s.id}`,
        day: formatLongDay(s.slotStartUtc) ?? '—',
        title: s.facilityName,
        status: 'İşlem devam ediyor',
        action: 'Gör',
        to: '/spor-randevu',
        kind: 'Randevu',
        tone: 'info',
      })
    }
    for (const e of eventsUpcoming) {
      rows.push({
        id: `ue-${e.id}`,
        day: formatLongDay(e.startsAtUtc) ?? '—',
        title: e.eventTitle,
        status: 'İşlem devam ediyor',
        action: 'Gör',
        to: '/etkinliklerim',
        kind: 'Etkinlik',
        tone: 'info',
      })
    }
    for (const doc of docsReady) {
      rows.push({
        id: `rd-${doc.id}`,
        day: formatLongDay(doc.createdAtUtc) ?? 'Sonuç',
        title: doc.title,
        status: 'Tamamlandı',
        action: 'Al',
        to: '/basvurular',
        kind: 'Başvuru sonucu',
        tone: 'ok',
      })
    }
    return rows.slice(0, 4)
  }, [openDebts, sportsUpcoming, eventsUpcoming, docsReady])

  const notices: HubNotice[] = useMemo(() => {
    if (!data || !user) return []
    const prefs = loadNotifyPrefs(user.userId)
    const items: HubNotice[] = []

    if (prefs.payment) {
      for (const d of openDebts) {
        items.push({
          id: `pay-${d.id}`,
          kind: 'payment',
          kindLabel: 'Ödeme hatırlatma',
          title: `${debtTypeLabel(d.type)} · ${money(d.totalPayable)}`,
          detail: `Son ödeme ${formatDate(d.dueDateUtc) ?? '—'}`,
          to: '/vezne',
        })
      }
    }

    if (prefs.result) {
      for (const doc of docsReady) {
        items.push({
          id: `res-${doc.id}`,
          kind: 'result',
          kindLabel: 'Başvuru sonucu',
          title: doc.title,
          detail: 'Belgeniz teslime hazır',
          to: '/basvurular',
        })
      }
    }

    if (prefs.announcement) {
      for (const item of data.announcements) {
        items.push({
          id: `ann-${item.id}`,
          kind: 'announcement',
          kindLabel: 'Duyuru',
          title: item.title,
          detail: formatDate(item.publishStartUtc ?? item.createdAtUtc) ?? 'Belediye duyurusu',
          to: `/duyurular/${item.id}`,
        })
      }
    }

    if (prefs.system) {
      items.push({
        id: 'sys-session',
        kind: 'system',
        kindLabel: 'Sistem',
        title: 'Oturumunuz açık',
        detail: lastSeen
          ? `Son ziyaret ${lastSeen.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}`
          : 'Kişisel hizmet merkezine hoş geldiniz',
        to: '/ayarlar#bildirimler',
      })
    }

    return items.slice(0, 6)
  }, [data, user, openDebts, docsReady, lastSeen])

  function toggleFav(id: string) {
    if (!user) return
    setFavs((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      const stored = next.length === 0 ? [...DEFAULT_FAVS] : next
      writeFavs(user.userId, stored)
      return stored
    })
  }

  function markNoticeRead(id: string) {
    if (!user) return
    setReadIds((current) => {
      if (current.includes(id)) return current
      const next = [...current, id]
      saveReadNoticeIds(user.userId, next)
      return next
    })
  }

  function markAllNoticesRead() {
    if (!user || notices.length === 0) return
    const next = [...new Set([...readIds, ...notices.map((item) => item.id)])]
    saveReadNoticeIds(user.userId, next)
    setReadIds(next)
  }

  const favoriteServices = SERVICES.filter((s) => favs.includes(s.id))
  const urgentAlert = alerts[0] ?? null
  const unreadCount = notices.filter((item) => !readIds.includes(item.id)).length

  return (
    <div className="container hub-page">
      <section className="hub-welcome">
        <div className="hub-welcome-copy">
          <p className="hub-kicker">Kişisel hizmet merkezi</p>
          <h1>Hoş geldiniz, {greeting}</h1>
          <p className="hub-lead">Bugün belediye hizmetlerinize hızlıca ulaşabilirsiniz.</p>
          <p className="hub-meta">
            {lastSeen
              ? `Bu cihazdaki son ziyaret: ${lastSeen.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}`
              : data?.profile
                ? `Hesap açılışı: ${formatDate(data.profile.createdAtUtc)}`
                : 'Oturumunuz açık'}
          </p>
          {urgentAlert ? (
            <p className="hub-alerts">
              <Link to={urgentAlert.to}>{urgentAlert.text}</Link>
            </p>
          ) : null}
        </div>
        <div className="hub-welcome-actions">
          <p className="hub-welcome-label">Hızlı işlem</p>
          <Link className="hub-chip" to="/borclar">
            Borçlarım
          </Link>
          <Link className="hub-chip" to="/talepler">
            Taleplerim
          </Link>
          <Link className="hub-chip" to="/basvurular">
            Belgelerim
          </Link>
        </div>
      </section>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="hub-metrics" aria-label="Hizmet özeti">
        {loading ? (
          <>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="hub-metric is-skeleton" />
            ))}
          </>
        ) : failed ? (
          <p className="hub-empty">Borç ve talep özeti şu an alınamadı. Durum “tamamlandı” olarak gösterilmez.</p>
        ) : (
          <>
            <MetricCard
              icon="home"
              label="Emlak borcu"
              value={propertyOpen.length ? money(propertyOpen.reduce((s, d) => s + d.totalPayable, 0)) : 'Yok'}
              hint={
                propertyOpen.length
                  ? `Son ödeme: ${formatDate(nearestDue(propertyOpen)?.dueDateUtc) ?? '—'}`
                  : 'Açık emlak kaydı yok'
              }
              status={propertyOpen.length ? 'Ödeme bekliyor' : 'Bulunmuyor'}
              action={propertyOpen.length ? 'Öde' : 'Vezne'}
              to="/vezne"
              tone={propertyOpen.length ? 'warn' : 'muted'}
            />
            <MetricCard
              icon="drop"
              label="Su borcu"
              value={waterOpen.length ? money(waterOpen.reduce((s, d) => s + d.totalPayable, 0)) : 'Yok'}
              hint={
                waterOpen.length
                  ? `Son ödeme: ${formatDate(nearestDue(waterOpen)?.dueDateUtc) ?? '—'}`
                  : 'Açık su faturası yok'
              }
              status={waterOpen.length ? 'Ödeme bekliyor' : 'Bulunmuyor'}
              action={waterOpen.length ? 'Öde' : 'Vezne'}
              to="/vezne"
              tone={waterOpen.length ? 'warn' : 'muted'}
            />
            <MetricCard
              icon="megaphone"
              label="Açık talep"
              value={String(openReqs.length)}
              hint={openReqs.length ? 'Süreçte olan başvurularınız var' : 'Aktif talep bulunmuyor'}
              status={openReqs.length ? 'İşlem devam ediyor' : 'Bulunmuyor'}
              action={openReqs.length ? 'Takip et' : 'Oluştur'}
              to="/talepler"
              tone={openReqs.length ? 'info' : 'muted'}
            />
            <MetricCard
              icon="card"
              label="Kart bakiyesi"
              value={money(balance)}
              hint={data?.cards.length ? `${data.cards.length} ulaşım kartı` : 'Kart kaydı yok'}
              status={data?.cards.length ? 'İşlem devam ediyor' : 'Bulunmuyor'}
              action="Yükle"
              to="/ulasim"
              tone={data?.cards.length ? 'info' : 'muted'}
            />
          </>
        )}
      </section>

      <section className="hub-block">
        <header className="hub-block-head">
          <h2>Hizmet durumu</h2>
          <p>Başvuru, ödeme, talep, randevu ve belgeleriniz tek bakışta.</p>
        </header>
        <div className="hub-lanes">
          {loading
            ? Array.from({ length: 5 }, (_, i) => <div key={i} className="hub-lane is-skeleton" />)
            : lanes.map((lane) => (
                <article key={lane.id} className={`hub-lane tone-${lane.tone}`}>
                  <span className="hub-lane-status">{lane.status}</span>
                  <h3>{lane.title}</h3>
                  <p>{lane.detail}</p>
                  {lane.date ? (
                    <time>Son güncelleme {formatDate(lane.date)}</time>
                  ) : (
                    <span className="hub-lane-empty">Son güncelleme yok</span>
                  )}
                  <Link className="hub-btn" to={lane.to}>
                    {lane.action}
                  </Link>
                </article>
              ))}
        </div>
      </section>

      <div className="hub-split">
        <section className="hub-block">
          <header className="hub-block-head">
            <h2>Son işlemler</h2>
            <p>Ödeme, talep, biniş ve bakiye hareketleriniz.</p>
          </header>
          {loading ? (
            <div className="hub-timeline is-skeleton" aria-busy="true" />
          ) : failed ? (
            <p className="hub-empty">İşlem geçmişi yüklenemedi.</p>
          ) : timeline.length === 0 ? (
            <p className="hub-empty">Henüz işlem kaydı yok. Vezne veya talep ile başlayabilirsiniz.</p>
          ) : (
            <ol className="hub-timeline">
              {timeline.map((row) => (
                <li key={row.id} className={`tone-${row.tone}`}>
                  <Link to={row.to}>
                    <span className="hub-dot" aria-hidden>
                      <HubIcon name={row.icon} />
                    </span>
                    <strong>{row.title}</strong>
                    <span className="hub-status">{row.status}</span>
                    <p>{row.detail}</p>
                    <time>{formatDate(row.date)}</time>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="hub-block">
          <header className="hub-block-head">
            <h2>Yaklaşan işlemler</h2>
            <p>Vade, randevu ve başvuru sonuçları.</p>
          </header>
          {loading ? (
            <div className="hub-upcoming is-skeleton" />
          ) : failed ? (
            <p className="hub-empty">Yaklaşan işlemler yüklenemedi.</p>
          ) : upcoming.length === 0 ? (
            <p className="hub-empty">Yaklaşan ödeme veya randevu yok.</p>
          ) : (
            <ul className="hub-upcoming">
              {upcoming.map((row) => (
                <li key={row.id} className={`tone-${row.tone}`}>
                  <div>
                    <time>{row.day}</time>
                    <span>{row.kind}</span>
                    <strong>{row.title}</strong>
                    <em className="hub-status">{row.status}</em>
                  </div>
                  <Link className="hub-btn hub-btn--solid" to={row.to}>
                    {row.action}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="hub-block">
        <header className="hub-block-head">
          <h2>Favorilerim</h2>
        </header>
        {favoriteServices.length === 0 ? (
          <p className="hub-empty">Sık kullandığınız işlemlere yıldız koyun.</p>
        ) : (
          <ul className="hub-favs">
            {favoriteServices.map((svc) => (
              <li key={svc.id}>
                <Link to={svc.to} className="hub-fav-card">
                  <span className="hub-svc-icon" aria-hidden>
                    <HubIcon name={svc.icon} />
                  </span>
                  <strong>{svc.title}</strong>
                  <span>{svc.action}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FavoriteLines lines={data?.lines ?? []} />
      <ContactMessagesBlock items={data?.contacts ?? []} />

      <section className="hub-block">
        <header className="hub-block-head">
          <h2>Hızlı erişim</h2>
          <p>En çok kullanılan belediye işlemleri.</p>
        </header>
        <div className="hub-services">
          {SERVICES.map((svc) => (
            <article key={svc.id} className="hub-svc">
              <button
                type="button"
                className={`hub-star${favs.includes(svc.id) ? ' is-on' : ''}`}
                aria-pressed={favs.includes(svc.id)}
                aria-label={`${svc.title} favori`}
                onClick={() => toggleFav(svc.id)}
              >
                ★
              </button>
              <span className="hub-svc-icon" aria-hidden>
                <HubIcon name={svc.icon} />
              </span>
              <h3>{svc.title}</h3>
              <p>{svc.blurb}</p>
              <Link className="hub-btn" to={svc.to}>
                {svc.action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="hub-split hub-split--bottom">
        <section className="hub-block" id="bildirimler">
          <header className="hub-block-head">
            <h2>Bildirimler {unreadCount > 0 ? <em>{unreadCount}</em> : null}</h2>
            <p>
              Ödeme, başvuru ve duyurular.{' '}
              <Link to="/ayarlar#bildirimler">Ayarlar</Link>
              {unreadCount > 0 ? (
                <>
                  {' · '}
                  <button type="button" className="hub-text-btn" onClick={markAllNoticesRead}>
                    Tümünü okundu say
                  </button>
                </>
              ) : null}
            </p>
          </header>
          {loading ? (
            <p className="hub-empty">Bildirimler yükleniyor…</p>
          ) : failed ? (
            <p className="hub-empty">Bildirimler yüklenemedi.</p>
          ) : notices.length === 0 ? (
            <p className="hub-empty">Gösterilecek bildirim yok.</p>
          ) : (
            <ul className="hub-notices">
              {notices.map((item) => {
                const unread = !readIds.includes(item.id)
                return (
                  <li key={item.id} className={unread ? 'is-unread' : 'is-read'}>
                    <Link to={item.to} onClick={() => markNoticeRead(item.id)}>
                      <span>{item.kindLabel}</span>
                      <strong>{item.title}</strong>
                      <em>{item.detail}</em>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="hub-profile">
          <div className="hub-avatar" aria-hidden>
            {initials(displayName)}
          </div>
          <div>
            <p className="hub-kicker">Hesabınız</p>
            <h2>{displayName}</h2>
            <p>{data?.profile?.email ?? 'E-posta yükleniyor'}</p>
            <p>{data?.profile?.phoneNumber || 'Telefon kayıtlı değil'}</p>
          </div>
          <nav className="hub-profile-actions" aria-label="Hesap kısayolları">
            <Link className="hub-btn hub-btn--solid" to="/ayarlar#profil">
              Profil
            </Link>
            <Link className="hub-btn" to="/ayarlar#iletisim">
              İletişim
            </Link>
            <Link className="hub-btn" to="/ayarlar#parola">
              Şifre
            </Link>
          </nav>
        </section>
      </div>
    </div>
  )
}

function ContactMessagesBlock({ items }: { items: ContactMessageSummary[] }) {
  return (
    <section className="hub-block">
      <header className="hub-block-head">
        <h2>İletişim taleplerim</h2>
        <p>İletişim formundan gönderilen yazışmalar.</p>
      </header>
      {items.length === 0 ? (
        <p className="hub-empty">
          Henüz iletişim kaydı yok. <Link to="/iletisim">İletişim merkezinden</Link> yazın.
        </p>
      ) : (
        <ul className="hub-lines">
          {items.slice(0, 6).map((item) => (
            <li key={item.id}>
              <Link to={`/basvuru-takip?kod=${encodeURIComponent(item.trackingCode)}`}>
                <strong>{item.trackingCode}</strong>
                <span>
                  {item.subject} · {contactStatusLabel(item.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function FavoriteLines({ lines }: { lines: BusLine[] }) {
  const [ids, setIds] = useState(() => readFavoriteLineIds())
  const favs = lines.filter((line) => ids.includes(line.id))

  return (
    <section className="hub-block">
      <header className="hub-block-head">
        <h2>Favori hatlar</h2>
        <p>Hat detayından eklediğiniz güzergâhlar.</p>
      </header>
      {favs.length === 0 ? (
        <p className="hub-empty">
          Henüz favori hat yok. <Link to="/hatlar">Katalogdan</Link> ekleyebilirsiniz.
        </p>
      ) : (
        <ul className="hub-lines">
          {favs.map((line) => {
            const parsed = parseLineSummary(line.routeSummary)
            return (
              <li key={line.id}>
                <Link to={`/hatlar/${line.id}`}>
                  <strong>
                    {line.code} {line.name}
                  </strong>
                  <span>{parsed.route || 'Güzergâh'}</span>
                </Link>
                <button
                  type="button"
                  className="hub-star is-on"
                  aria-pressed
                  aria-label={`${line.code} favoriden çıkar`}
                  onClick={() => setIds(toggleFavoriteLine(line.id))}
                >
                  ★
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  status,
  action,
  to,
  tone,
}: {
  icon: IconName
  label: string
  value: string
  hint: string
  status: string
  action: string
  to: string
  tone: Tone
}) {
  return (
    <article className={`hub-metric tone-${tone}`}>
      <span className="hub-metric-icon" aria-hidden>
        <HubIcon name={icon} />
      </span>
      <span className="hub-metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="hub-status">{status}</span>
      <p>{hint}</p>
      <Link className="hub-btn" to={to}>
        {action}
      </Link>
    </article>
  )
}

type IconName = 'wallet' | 'file' | 'megaphone' | 'calendar' | 'card' | 'heart' | 'home' | 'drop'

function HubIcon({ name }: { name: IconName }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (name === 'wallet') {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
        <circle cx="16.5" cy="14.5" r="1" fill="currentColor" />
      </svg>
    )
  }
  if (name === 'file') {
    return (
      <svg {...common}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
    )
  }
  if (name === 'megaphone') {
    return (
      <svg {...common}>
        <path d="M4 10v4h3l5 3V7L7 10H4z" />
        <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
      </svg>
    )
  }
  if (name === 'calendar') {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      </svg>
    )
  }
  if (name === 'card') {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>
    )
  }
  if (name === 'heart') {
    return (
      <svg {...common}>
        <path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
      </svg>
    )
  }
  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6.5 10.5V20h11v-9.5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M12 3.5c3 3.2 6.5 6 6.5 9.4A6.5 6.5 0 1 1 5.5 12.9C5.5 9.5 9 6.7 12 3.5z" />
    </svg>
  )
}
