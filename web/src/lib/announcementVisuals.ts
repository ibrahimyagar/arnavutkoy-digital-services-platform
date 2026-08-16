import type { Announcement } from './api'
import { COVERS, type ContentCover } from './contentVisuals'

export type AnnouncementCategoryId =
  | 'ulasim'
  | 'cevre'
  | 'sosyal'
  | 'altyapi'
  | 'sistem'
  | 'genel'

export type AnnouncementCategory = {
  id: AnnouncementCategoryId
  label: string
  cover: ContentCover
}

export const ANNOUNCEMENT_CATEGORIES: readonly AnnouncementCategory[] = [
  { id: 'ulasim', label: 'Ulaşım', cover: COVERS.projects },
  { id: 'cevre', label: 'Çevre', cover: COVERS.waste },
  { id: 'sosyal', label: 'Sosyal destek', cover: COVERS.guide },
  { id: 'altyapi', label: 'Altyapı', cover: COVERS.park },
  { id: 'sistem', label: 'Sistem', cover: COVERS.eBelediye },
  { id: 'genel', label: 'Genel', cover: COVERS.announcements },
]

const KEYWORDS: Record<Exclude<AnnouncementCategoryId, 'genel'>, string[]> = {
  ulasim: ['yol', 'hat', 'güzergâh', 'guzergah', 'otobüs', 'otobus', 'ulaşım', 'ulasim', 'trafik', 'cadde'],
  cevre: ['temizlik', 'sahil', 'göl', 'gol', 'çevre', 'cevre', 'atık', 'atik'],
  sosyal: ['sosyal yardım', 'sosyal destek', 'yardım başvuru', 'yardim basvuru'],
  altyapi: ['aydınlatma', 'aydinlatma', 'çarşı', 'carsi', 'park', 'yenileme', 'altyapı', 'altyapi', 'led'],
  sistem: ['planlı bakım', 'planli bakim', 'sistem', 'dijital hizmet', 'platform', 'erişime kapat'],
}

const MONTHS_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
] as const

export function classifyAnnouncement(title: string, content: string): AnnouncementCategory {
  const fromTitle = classifyHay(title)
  if (fromTitle.id !== 'genel') return fromTitle
  return classifyHay(`${title} ${content}`)
}

function classifyHay(haystack: string): AnnouncementCategory {
  const hay = haystack.toLocaleLowerCase('tr-TR')
  const ordered: Exclude<AnnouncementCategoryId, 'genel'>[] = [
    'sosyal',
    'cevre',
    'ulasim',
    'altyapi',
    'sistem',
  ]
  for (const id of ordered) {
    if (KEYWORDS[id].some((keyword) => hay.includes(keyword))) {
      return ANNOUNCEMENT_CATEGORIES.find((category) => category.id === id)!
    }
  }
  return ANNOUNCEMENT_CATEGORIES.find((category) => category.id === 'genel')!
}

export function announcementPublishedAt(item: Announcement): Date {
  return new Date(item.publishStartUtc ?? item.createdAtUtc)
}

export function formatAnnouncementStamp(date: Date): { day: string; month: string } {
  return {
    day: date.toLocaleDateString('tr-TR', { day: '2-digit' }),
    month: MONTHS_SHORT[date.getMonth()] ?? date.toLocaleDateString('tr-TR', { month: 'short' }),
  }
}

export function formatAnnouncementWhen(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const end = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((startOfEnd.getTime() - startOfToday.getTime()) / 86_400_000)
}

export function excerpt(text: string, max = 168): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trimEnd()}…`
}

export type AnnouncementExtras = {
  area?: string
  unit?: string
  contact?: string
  hours?: string
  apply?: string
  link?: string
  document?: string
}

const EXTRA_FIELDS: { prefix: string; key: keyof AnnouncementExtras }[] = [
  { prefix: 'Etkilenen yerler:', key: 'area' },
  { prefix: 'Sorumlu birim:', key: 'unit' },
  { prefix: 'İletişim:', key: 'contact' },
  { prefix: 'Çalışma saati:', key: 'hours' },
  { prefix: 'Başvuru:', key: 'apply' },
  { prefix: 'Bağlantı:', key: 'link' },
  { prefix: 'Belge:', key: 'document' },
]

export function parseAnnouncementContent(content: string): {
  lead: string
  paragraphs: string[]
  extras: AnnouncementExtras
} {
  const extras: AnnouncementExtras = {}
  const bodyLines: string[] = []

  for (const raw of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    const field = EXTRA_FIELDS.find((item) =>
      line.toLocaleLowerCase('tr-TR').startsWith(item.prefix.toLocaleLowerCase('tr-TR')),
    )
    if (field) {
      extras[field.key] = line.slice(field.prefix.length).trim()
      continue
    }
    bodyLines.push(raw)
  }

  const blocks = bodyLines
    .join('\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  return {
    lead: blocks[0] ?? '',
    paragraphs: blocks.slice(1),
    extras,
  }
}

export function hasAnnouncementExtras(extras: AnnouncementExtras): boolean {
  return Boolean(
    extras.area || extras.unit || extras.contact || extras.hours || extras.apply || extras.link || extras.document,
  )
}

export function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 160))
}

export function normalizeAnnouncementHref(raw: string): string {
  const value = raw.trim()
  if (/^https?:\/\//i.test(value) || value.startsWith('tel:') || value.startsWith('mailto:')) return value
  return value.startsWith('/') ? value : `/${value.replace(/^\//, '')}`
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

export function announcementCtas(extras: AnnouncementExtras): { label: string; href: string }[] {
  const rows: { label: string; href: string }[] = []
  if (extras.apply) rows.push({ label: 'Başvuruya git', href: normalizeAnnouncementHref(extras.apply) })
  if (extras.document) rows.push({ label: 'Belgeyi görüntüle', href: normalizeAnnouncementHref(extras.document) })
  if (extras.link) rows.push({ label: 'İlgili sayfa', href: normalizeAnnouncementHref(extras.link) })
  return rows
}

export function relatedAnnouncementService(categoryId: AnnouncementCategoryId): { to: string; label: string } {
  switch (categoryId) {
    case 'ulasim':
      return { to: '/ulasim-agi', label: 'Ulaşım ağı' }
    case 'sosyal':
      return { to: '/yardim', label: 'Sosyal yardım başvurusu' }
    case 'sistem':
      return { to: '/e-belediye', label: 'E-Belediye' }
    case 'cevre':
      return { to: '/talepler', label: 'Talep bildir' }
    case 'altyapi':
      return { to: '/talepler', label: 'Hizmet masası' }
    default:
      return { to: '/hizmet-rehberi', label: 'Hizmet rehberi' }
  }
}

export function contactTelHref(contact: string): string | null {
  const digits = contact.replace(/\D/g, '')
  if (digits.length < 7) return null
  return `tel:${digits}`
}

export function announcementShareUrl(id: string): string {
  if (typeof window === 'undefined') return `/duyurular/${id}`
  return `${window.location.origin}/duyurular/${id}`
}

export async function shareAnnouncement(item: Announcement): Promise<'shared' | 'copied'> {
  const url = announcementShareUrl(item.id)
  const payload = { title: item.title, text: excerpt(item.content, 140), url }
  const gesture = typeof navigator !== 'undefined' && Boolean(navigator.userActivation?.isActive)
  if (gesture && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err
    }
  }
  await copyText(url)
  return 'copied'
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      /* fall through */
    }
  }
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.cssText = 'position:fixed;left:-9999px;top:0'
  document.body.appendChild(field)
  field.select()
  field.setSelectionRange(0, text.length)
  const ok = document.execCommand('copy')
  field.remove()
  if (!ok) throw new Error('copy-failed')
}
