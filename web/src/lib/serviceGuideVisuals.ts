import type { PortalContent } from './api'
import { COVERS, type ContentCover } from './contentVisuals'

export const GUIDE_ROUTE = '/hizmet-rehberi'

export const GUIDE_CATEGORIES = [
  'Mali işlemler',
  'İmar & şehircilik',
  'Başvuru & belgeler',
  'Nikah & aile',
  'Spor',
  'Sosyal hizmetler',
  'Ulaşım',
  'Destek',
] as const

export const GUIDE_KINDS = ['Ödeme', 'Başvuru', 'Sorgulama', 'Randevu', 'Belge', 'Takip', 'Destek'] as const

export type GuideKind = (typeof GUIDE_KINDS)[number]

export const FEATURED_SLUGS = [
  'rehber-vergi',
  'rehber-imar',
  'rehber-nikah',
  'rehber-spor',
  'rehber-takip',
] as const

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RECENT_KEY = 'arnavutkoy.guide.recent'

const KIND_SET = new Set<string>(GUIDE_KINDS)

export type GuideExtras = {
  route?: string
  kind?: GuideKind
  cta?: string
  online: boolean
  requiresAuth: boolean
  keywords: string[]
  scenario?: string
  steps: string[]
  related: string[]
}

export type ParsedGuide = {
  paragraphs: string[]
  sections: { title: string; text: string }[]
  extras: GuideExtras
}

export function isGuideId(value: string): boolean {
  return GUID.test(value)
}

export function guideHref(item: Pick<PortalContent, 'id' | 'slug'>): string {
  return `${GUIDE_ROUTE}/${item.slug || item.id}`
}

export function coverForGuide(item: PortalContent): ContentCover {
  return { src: COVERS.guide.src, alt: `${item.title} — hizmet rehberi görseli` }
}

export function parseGuideBody(body: string): ParsedGuide {
  const extras: GuideExtras = {
    online: false,
    requiresAuth: false,
    keywords: [],
    steps: [],
    related: [],
  }
  const paragraphs: string[] = []
  const sections: { title: string; text: string }[] = []
  let current: { title: string; lines: string[] } | null = null

  const flush = () => {
    if (!current) return
    const text = current.lines.join(' ').trim()
    if (text) sections.push({ title: current.title, text })
    current = null
  }

  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('Rota:')) extras.route = line.slice(5).trim()
    else if (line.startsWith('Tür:')) {
      const value = line.slice(4).trim()
      if (KIND_SET.has(value)) extras.kind = value as GuideKind
    } else if (line.startsWith('CTA:')) extras.cta = line.slice(4).trim()
    else if (line.startsWith('Online:')) extras.online = /^evet$/i.test(line.slice(7).trim())
    else if (line.startsWith('Giriş:')) extras.requiresAuth = /^evet$/i.test(line.slice(6).trim())
    else if (line.startsWith('Anahtar:')) {
      extras.keywords = splitList(line.slice(8))
    } else if (line.startsWith('Senaryo:')) extras.scenario = line.slice(8).trim()
    else if (line.startsWith('Adımlar:')) extras.steps = splitList(line.slice(8), '|')
    else if (line.startsWith('İlgili:')) extras.related = splitList(line.slice(7))
    else if (line.startsWith('## ')) {
      flush()
      current = { title: line.slice(3).trim(), lines: [] }
    } else if (current) {
      current.lines.push(line)
    } else {
      paragraphs.push(line)
    }
  }
  flush()

  return { paragraphs, sections, extras }
}

export function searchGuide(item: PortalContent, needle: string): boolean {
  if (!needle) return true
  const parsed = parseGuideBody(item.body)
  const hay = [
    item.title,
    item.summary,
    item.category ?? '',
    parsed.paragraphs.join(' '),
    parsed.sections.map((section) => `${section.title} ${section.text}`).join(' '),
    parsed.extras.kind ?? '',
    parsed.extras.cta ?? '',
    parsed.extras.scenario ?? '',
    ...parsed.extras.keywords,
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR')
  return hay.includes(needle)
}

export function presentGuideCategories(items: PortalContent[]): string[] {
  const seen = new Set(items.map((item) => item.category).filter(Boolean) as string[])
  const known = GUIDE_CATEGORIES.filter((label) => seen.has(label))
  const extra = [...seen]
    .filter((label) => !known.includes(label as (typeof GUIDE_CATEGORIES)[number]))
    .sort((a, b) => a.localeCompare(b, 'tr'))
  return ['Tümü', ...known, ...extra]
}

export function presentGuideKinds(items: PortalContent[]): GuideKind[] {
  const seen = new Set<GuideKind>()
  for (const item of items) {
    const kind = parseGuideBody(item.body).extras.kind
    if (kind) seen.add(kind)
  }
  return GUIDE_KINDS.filter((kind) => seen.has(kind))
}

export function featuredGuides(items: PortalContent[]): PortalContent[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]))
  return FEATURED_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean) as PortalContent[]
}

export function scenarioGuides(items: PortalContent[]): { question: string; item: PortalContent }[] {
  const preferred = new Set<string>([...FEATURED_SLUGS, 'rehber-borc', 'rehber-belge'])
  return items
    .filter((item) => preferred.has(item.slug))
    .map((item) => {
      const scenario = parseGuideBody(item.body).extras.scenario
      return scenario ? { question: scenario, item } : null
    })
    .filter(Boolean) as { question: string; item: PortalContent }[]
}

export function relatedGuides(current: PortalContent, pool: PortalContent[]): PortalContent[] {
  const extras = parseGuideBody(current.body).extras
  const bySlug = new Map(pool.map((item) => [item.slug, item]))
  const fromSlugs = extras.related
    .map((slug) => bySlug.get(slug))
    .filter((item): item is PortalContent => Boolean(item) && item.id !== current.id)
  if (fromSlugs.length > 0) return fromSlugs.slice(0, 4)
  return pool
    .filter((item) => item.id !== current.id && item.category && item.category === current.category)
    .slice(0, 4)
}

export function defaultGuideSteps(kind?: GuideKind): string[] {
  if (kind === 'Ödeme') return ['Hizmeti seçin', 'Giriş yapın', 'Borcu seçin', 'Demo ödemeyi tamamlayın']
  if (kind === 'Takip') return ['Takip kodunuzu alın', 'Başvuru takibine gidin', 'Kodu girin', 'Durumu görün']
  if (kind === 'Randevu') return ['Hizmeti seçin', 'Uygun saati bulun', 'Randevuyu tamamlayın', 'Kodu saklayın']
  if (kind === 'Sorgulama') return ['Hizmeti seçin', 'Bilgilerinizi girin', 'Sonucu görün', 'Gerekirse işleme geçin']
  return ['Hizmeti seçin', 'Gerekirse giriş yapın', 'İşlemi tamamlayın', 'Sonucu takip edin']
}

export function readRecentGuides(pool: PortalContent[]): PortalContent[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const slugs = JSON.parse(raw) as string[]
    if (!Array.isArray(slugs)) return []
    const bySlug = new Map(pool.map((item) => [item.slug, item]))
    return slugs.map((slug) => bySlug.get(slug)).filter(Boolean) as PortalContent[]
  } catch {
    return []
  }
}

export function rememberGuide(slug: string) {
  if (!slug) return
  try {
    const raw = sessionStorage.getItem(RECENT_KEY)
    const prev = raw ? (JSON.parse(raw) as string[]) : []
    const next = [slug, ...prev.filter((item) => item !== slug)].slice(0, 4)
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
}

function splitList(value: string, delimiter = ','): string[] {
  return value
    .split(delimiter)
    .map((part) => part.trim())
    .filter(Boolean)
}
