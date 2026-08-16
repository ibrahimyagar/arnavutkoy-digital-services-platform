import type { Announcement, PortalContent } from './api'
import { COVERS, type ContentCover } from './contentVisuals'

export const NEWS_CATEGORIES = [
  'Belediye',
  'Çevre',
  'Teknoloji',
  'Eğitim',
  'Spor',
  'Kültür',
  'İmar',
  'Sağlık',
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

export type NewsBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'q'; text: string }
  | { type: 'ul'; items: string[] }

export type NewsExtras = {
  source?: string
  tags: string[]
  activitySlug?: string
  eventSlug?: string
  announcementTitle?: string
}

export type ParsedNews = {
  blocks: NewsBlock[]
  extras: NewsExtras
  headings: string[]
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const FRESH_DAYS = 30
const NEW_DAYS = 21

const COVER_BY_CATEGORY: Record<string, ContentCover> = {
  Belediye: COVERS.mayor,
  Çevre: COVERS.waste,
  Teknoloji: { src: '/hero-harbor.jpg', alt: 'Karaburun sahil ve kıyı hattı' },
  Eğitim: COVERS.coding,
  Spor: COVERS.events,
  Kültür: COVERS.culture,
  İmar: COVERS.projects,
  Sağlık: COVERS.guide,
}

const COVER_BY_SLUG: Record<string, ContentCover> = {
  'haber-dalga-enerjisi': {
    src: '/hero-harbor.jpg',
    alt: 'Karaburun kıyısı — dalga enerjisi haber görseli',
  },
  'haber-gurultu-bariyeri': COVERS.waste,
  'haber-dursunkoy-doga': COVERS.park,
  'haber-sifir-atik-mutfak': COVERS.announcements,
  'haber-15-temmuz': COVERS.mayor,
  'haber-mavi-bayrak': COVERS.projects,
  'haber-bm-sifir-atik': COVERS.waste,
  'haber-vex-robotik': COVERS.coding,
  'haber-vadipark': COVERS.events,
  'haber-deneyap': COVERS.eBelediye,
  'haber-dunya-romanlar': COVERS.culture,
  'haber-beyaz-flama': COVERS.guide,
  'haber-kentsel-donusum': COVERS.news,
  'haber-mobil-hizmet': COVERS.eBelediye,
  'haber-olimpik-spor': COVERS.park,
  'haber-yks-destek': COVERS.guide,
  'haber-mobil-mamografi': COVERS.institution,
  'haber-secap': COVERS.rhythm,
}

const FALLBACK_COVER: ContentCover = {
  src: '/home/svc-faaliyet.jpg',
  alt: 'Arnavutköy kent gündemi görseli',
}

export function isNewsId(value: string): boolean {
  return GUID.test(value)
}

export function newsHref(item: Pick<PortalContent, 'id' | 'slug'>): string {
  return `/haberler/${item.slug || item.id}`
}

export function publishedAt(item: PortalContent): Date {
  return new Date(item.startsAtUtc ?? item.createdAtUtc)
}

export function coverForNews(item: PortalContent): ContentCover {
  const mapped = COVER_BY_SLUG[item.slug] ?? COVER_BY_CATEGORY[item.category ?? '']
  if (!mapped) return FALLBACK_COVER
  return {
    src: mapped.src,
    alt: `${item.title} — haber görseli`,
  }
}

export function newsGallery(item: PortalContent): ContentCover[] {
  const primary = coverForNews(item)
  const extras = [
    COVER_BY_CATEGORY[item.category ?? ''] ?? FALLBACK_COVER,
    COVERS.park,
    COVERS.waste,
  ].filter((image) => image.src !== primary.src)
  return [primary, ...extras.slice(0, 2)]
}

export function isFeaturedNews(item: PortalContent): boolean {
  return item.sortOrder === 1
}

export function isFreshNews(item: PortalContent, now = new Date()): boolean {
  const published = publishedAt(item).getTime()
  return now.getTime() - published <= FRESH_DAYS * 86_400_000
}

export function isNewNews(item: PortalContent, now = new Date()): boolean {
  const published = publishedAt(item).getTime()
  return now.getTime() - published <= NEW_DAYS * 86_400_000
}

export function readingMinutes(body: string): number {
  const words = body
    .replace(/Kaynak:[\s\S]*$/i, '')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(2, Math.round(words / 180))
}

export function formatNewsDate(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatNewsStamp(date: Date): string {
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function newsMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function newsMonthLabel(date: Date): string {
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

export function pickLeadNews(items: PortalContent[]): PortalContent | null {
  return items.find(isFeaturedNews) ?? items[0] ?? null
}

export function parseNewsBody(body: string): ParsedNews {
  const extras: NewsExtras = { tags: [] }
  const contentLines: string[] = []

  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      contentLines.push('')
      continue
    }
    if (line.startsWith('Kaynak:')) extras.source = line.slice(7).trim()
    else if (line.startsWith('Etiket:')) {
      extras.tags = line
        .slice(7)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    } else if (line.startsWith('Faaliyet:')) extras.activitySlug = line.slice(9).trim()
    else if (line.startsWith('Etkinlik:')) extras.eventSlug = line.slice(9).trim()
    else if (line.startsWith('Duyuru:')) extras.announcementTitle = line.slice(7).trim()
    else contentLines.push(raw)
  }

  const blocks: NewsBlock[] = []
  const headings: string[] = []
  let list: string[] = []

  const flushList = () => {
    if (list.length === 0) return
    blocks.push({ type: 'ul', items: list })
    list = []
  }

  for (const raw of contentLines) {
    const line = raw.trim()
    if (!line) {
      flushList()
      continue
    }
    if (line.startsWith('- ')) {
      list.push(line.slice(2).trim())
      continue
    }
    flushList()
    if (line.startsWith('## ')) {
      const text = line.slice(3).trim()
      headings.push(text)
      blocks.push({ type: 'h', text })
    } else if (line.startsWith('> ')) {
      blocks.push({ type: 'q', text: line.slice(2).trim() })
    } else {
      blocks.push({ type: 'p', text: line })
    }
  }
  flushList()

  return { blocks, extras, headings }
}

export function searchNews(item: PortalContent, needle: string): boolean {
  if (!needle) return true
  const extras = parseNewsBody(item.body).extras
  const hay = [
    item.title,
    item.summary,
    item.body,
    item.category ?? '',
    item.location ?? '',
    extras.tags.join(' '),
    extras.source ?? '',
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR')
  return hay.includes(needle)
}

export function relatedNews(current: PortalContent, pool: PortalContent[], take = 3): PortalContent[] {
  const tags = new Set(parseNewsBody(current.body).extras.tags.map((tag) => tag.toLocaleLowerCase('tr-TR')))
  const scored = pool
    .filter((item) => item.id !== current.id)
    .map((item) => {
      let score = 0
      if (item.category && item.category === current.category) score += 4
      if (item.location && item.location === current.location) score += 3
      const other = parseNewsBody(item.body).extras.tags
      for (const tag of other) {
        if (tags.has(tag.toLocaleLowerCase('tr-TR'))) score += 2
      }
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return publishedAt(b.item).getTime() - publishedAt(a.item).getTime()
    })
    .slice(0, take)
    .map((entry) => entry.item)

  return scored
}

export function matchAnnouncement(title: string | undefined, items: Announcement[]): Announcement | null {
  if (!title) return null
  const needle = title.toLocaleLowerCase('tr-TR')
  return (
    items.find((item) => item.title.toLocaleLowerCase('tr-TR') === needle) ??
    items.find((item) => item.title.toLocaleLowerCase('tr-TR').includes(needle)) ??
    null
  )
}

export async function shareNews(title: string, href: string): Promise<void> {
  const url = `${window.location.origin}${href}`
  if (navigator.share) {
    await navigator.share({ title, url })
    return
  }
  await navigator.clipboard.writeText(url)
}
