import type { Announcement, Department, PortalContent, StaffMember } from './api'
import { classifyAnnouncement } from './announcementVisuals'
import { COVERS, type ContentCover } from './contentVisuals'
import { osmEmbedSrc, osmOpenSrc, venueForLocation } from './eventVisuals'

export const DEPT_CATEGORIES = [
  'Başkanlık',
  'Altyapı',
  'Yeşil',
  'Çevre',
  'Düzen',
  'Kültür',
  'Sosyal',
  'Dijital',
  'Mali',
  'Hukuk',
  'Şehircilik',
  'Ulaşım',
  'Destek',
  'Kurumsal',
] as const

export type DeptCategory = (typeof DEPT_CATEGORIES)[number]

export type DepartmentExtras = {
  category?: string
  phone?: string
  email?: string
  location?: string
  hours?: string
  services?: string
  duties?: string
  link?: string
}

const EXTRA_FIELDS: { prefix: string; key: keyof DepartmentExtras }[] = [
  { prefix: 'Kategori:', key: 'category' },
  { prefix: 'Telefon:', key: 'phone' },
  { prefix: 'E-posta:', key: 'email' },
  { prefix: 'Konum:', key: 'location' },
  { prefix: 'Saat:', key: 'hours' },
  { prefix: 'Hizmetler:', key: 'services' },
  { prefix: 'Görevler:', key: 'duties' },
  { prefix: 'Bağlantı:', key: 'link' },
]

const COVER_BY_CATEGORY: Record<string, ContentCover> = {
  Başkanlık: COVERS.mayor,
  Altyapı: COVERS.projects,
  Yeşil: COVERS.park,
  Çevre: COVERS.waste,
  Düzen: COVERS.announcements,
  Kültür: COVERS.culture,
  Sosyal: COVERS.guide,
  Dijital: COVERS.eBelediye,
  Mali: COVERS.eBelediye,
  Hukuk: COVERS.news,
  Şehircilik: COVERS.news,
  Ulaşım: COVERS.projects,
  Destek: COVERS.guide,
  Kurumsal: COVERS.mayor,
}

const PROJECT_CATS: Record<string, string[]> = {
  Altyapı: ['Altyapı'],
  Yeşil: ['Park'],
  Çevre: ['Çevre'],
  Ulaşım: ['Ulaşım'],
  Sosyal: ['Sosyal', 'Aile'],
  Kültür: ['Kültür'],
  Şehircilik: ['Şehircilik'],
  Dijital: ['Hizmet'],
  Mali: ['Hizmet'],
  Destek: ['Hizmet'],
}

const NEWS_CATS: Record<string, string[]> = {
  Altyapı: ['Altyapı'],
  Çevre: ['Çevre'],
  Sosyal: ['Sosyal'],
  Destek: ['Sosyal'],
  Ulaşım: ['Altyapı'],
}

const ANNOUNCE_CATS: Record<string, string[]> = {
  Altyapı: ['altyapi'],
  Yeşil: [],
  Çevre: ['cevre'],
  Ulaşım: ['ulasim'],
  Sosyal: ['sosyal'],
  Dijital: ['sistem'],
  Mali: ['sistem'],
  Destek: ['sosyal', 'sistem'],
  Şehircilik: ['altyapi'],
}

export function parseDepartmentDescription(description: string): {
  summary: string
  extras: DepartmentExtras
} {
  const extras: DepartmentExtras = {}
  const kept: string[] = []
  for (const raw of description.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    const field = EXTRA_FIELDS.find((entry) =>
      line.toLocaleLowerCase('tr-TR').startsWith(entry.prefix.toLocaleLowerCase('tr-TR')),
    )
    if (field) {
      extras[field.key] = line.slice(field.prefix.length).trim()
      continue
    }
    kept.push(raw)
  }
  const summary = kept.join('\n').replace(/\n{2,}/g, '\n').trim()
  return { summary, extras }
}

export function departmentCategory(department: Department): string {
  return parseDepartmentDescription(department.description).extras.category ?? 'Kurumsal'
}

export function coverForDepartment(department: Department): ContentCover {
  return COVER_BY_CATEGORY[departmentCategory(department)] ?? COVERS.mayor
}

export function departmentMonogram(name: string): string {
  const skip = new Set(['ve', 'ile', 'veya', 'için'])
  const parts = name
    .split(/\s+/)
    .filter((word) => !skip.has(word.toLocaleLowerCase('tr-TR')))
  return parts
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

export function staffInitials(fullName: string): string {
  const parts = fullName
    .replace(/\(demo\)/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return 'D'
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR')
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toLocaleUpperCase('tr-TR')
}

export function serviceList(extras: DepartmentExtras): string[] {
  return (extras.services ?? '')
    .split(/[·|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function dutyList(extras: DepartmentExtras): string[] {
  return (extras.duties ?? '')
    .split(/[·|;]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeDeptHref(href: string): string {
  if (href.startsWith('/')) return href
  try {
    const url = new URL(href, window.location.origin)
    return `${url.pathname}${url.search}`
  } catch {
    return href
  }
}

export function departmentVenue(extras: DepartmentExtras) {
  return venueForLocation(extras.location ?? null)
}

function nameTokens(departmentName: string): string[] {
  const skip = new Set(['müdürlüğü', 'hizmetleri', 'işleri', 've', 'ile'])
  return departmentName
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .filter((token) => token.length > 3 && !skip.has(token))
}

function titlesOverlap(left: string, right: string): boolean {
  const tokens = left
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .filter((token) => token.length > 4)
  if (tokens.length === 0) return false
  const hay = right.toLocaleLowerCase('tr-TR')
  const hits = tokens.filter((token) => hay.includes(token)).length
  return hits >= Math.min(2, tokens.length)
}

export function relatedProjectsForDepartment(
  extras: DepartmentExtras,
  items: PortalContent[],
): PortalContent[] {
  const allowed = new Set(PROJECT_CATS[extras.category ?? ''] ?? [])
  if (allowed.size === 0) return []
  return items.filter((item) => allowed.has(item.category ?? '')).slice(0, 2)
}

export function relatedNewsForDepartment(
  extras: DepartmentExtras,
  departmentName: string,
  items: PortalContent[],
): PortalContent[] {
  const allowed = new Set(NEWS_CATS[extras.category ?? ''] ?? [])
  const tokens = nameTokens(departmentName)
  return items
    .filter((item) => {
      if (allowed.has(item.category ?? '')) return true
      const hay = `${item.title} ${item.summary}`.toLocaleLowerCase('tr-TR')
      return tokens.some((token) => hay.includes(token))
    })
    .slice(0, 3)
}

export function relatedAnnouncementsForDepartment(
  extras: DepartmentExtras,
  departmentName: string,
  items: Announcement[],
): Announcement[] {
  const allowed = new Set(ANNOUNCE_CATS[extras.category ?? ''] ?? [])
  const tokens = nameTokens(departmentName)
  return items
    .filter((item) => {
      if (allowed.has(classifyAnnouncement(item.title, item.content).id)) return true
      const hay = `${item.title} ${item.content}`.toLocaleLowerCase('tr-TR')
      return tokens.some((token) => hay.includes(token))
    })
    .slice(0, 3)
}

export function emptyDirectoryPublications(category?: string): {
  title: string
  body: string
  links: { to: string; label: string }[]
} {
  if (category === 'Başkanlık') {
    return {
      title: 'Kurumsal yayımlar',
      body: 'Makam yazışması bu dizinde ayrı duyuru olarak tutulmaz. Başkanın mesajı ve kurumsal yapı sayfalarındadır.',
      links: [
        { to: '/baskan', label: 'Başkan' },
        { to: '/kurumsal', label: 'Kurumsal' },
      ],
    }
  }
  if (category === 'Hukuk') {
    return {
      title: 'Yayımlar',
      body: 'Bu birim resmi duyuru üretmez; tebligat ve sözleşme incelemesi dizin kaydındadır.',
      links: [
        { to: '/duyurular', label: 'Duyurular' },
        { to: '/iletisim', label: 'İletişim' },
      ],
    }
  }
  if (category === 'Kurumsal') {
    return {
      title: 'Personel yayımları',
      body: 'Özlük ve dizin işi bu sayfadadır; ayrı duyuru üretilmez. Kurumsal yapı ve yazışma kanalları bağlı sayfalardadır.',
      links: [
        { to: '/kurumsal', label: 'Kurumsal' },
        { to: '/iletisim', label: 'İletişim' },
      ],
    }
  }
  if (category === 'Kültür') {
    return {
      title: 'Yayımlar',
      body: 'Bu birimin takvimi etkinliklerdedir; eşleşen resmi duyuru veya haber yok.',
      links: [
        { to: '/etkinlikler', label: 'Etkinlikler' },
        { to: '/duyurular', label: 'Duyurular' },
      ],
    }
  }
  return {
    title: 'Yayımlar',
    body: 'Bu birimin görev alanında eşleşen resmi duyuru veya haber yok.',
    links: [
      { to: '/duyurular', label: 'Duyurular' },
      { to: '/haberler', label: 'Haberler' },
    ],
  }
}

export function relatedDirectoryMedia(
  extras: DepartmentExtras,
  departmentName: string,
  announcements: Announcement[],
  news: PortalContent[],
  projects: PortalContent[],
): {
  announcements: Announcement[]
  news: PortalContent[]
  projects: PortalContent[]
} {
  const notices = relatedAnnouncementsForDepartment(extras, departmentName, announcements).slice(0, 2)
  const stories = relatedNewsForDepartment(extras, departmentName, news)
    .filter((item) => !notices.some((notice) => titlesOverlap(notice.title, item.title)))
    .slice(0, notices.length > 0 ? 2 : 3)
  return {
    announcements: notices,
    news: stories,
    projects: relatedProjectsForDepartment(extras, projects),
  }
}

export function formatStaffPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('90')) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
  }
  return phone
}

export { osmEmbedSrc, osmOpenSrc }

export function staffMatchesQuery(member: StaffMember, departmentName: string, needle: string): boolean {
  if (!needle) return true
  return `${member.fullName} ${member.title} ${member.email} ${member.phoneNumber} ${departmentName}`
    .toLocaleLowerCase('tr-TR')
    .includes(needle)
}

export function departmentMatchesQuery(
  department: Department,
  extras: DepartmentExtras,
  summary: string,
  needle: string,
): boolean {
  if (!needle) return true
  return `${department.name} ${summary} ${extras.category ?? ''} ${extras.services ?? ''} ${extras.location ?? ''}`
    .toLocaleLowerCase('tr-TR')
    .includes(needle)
}
