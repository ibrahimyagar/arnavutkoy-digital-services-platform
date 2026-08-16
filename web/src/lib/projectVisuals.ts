import type { PortalContent } from './api'
import { COVERS, type ContentCover } from './contentVisuals'
import { osmEmbedSrc, osmOpenSrc, venueForLocation, type EventVenue } from './eventVisuals'

export const PROJECT_CATEGORIES = [
  'Park',
  'Ulaşım',
  'Altyapı',
  'Sosyal',
  'Çevre',
  'Spor',
  'Kültür',
  'Eğitim',
  'Aile',
  'Şehircilik',
  'Hizmet',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export type ProjectStatusId = 'planning' | 'ongoing' | 'done'

export type ProjectExtras = {
  status?: string
  progress?: string
  budget?: string
  contractor?: string
  link?: string
}

const EXTRA_FIELDS: { prefix: string; key: keyof ProjectExtras }[] = [
  { prefix: 'Durum:', key: 'status' },
  { prefix: 'İlerleme:', key: 'progress' },
  { prefix: 'Bütçe:', key: 'budget' },
  { prefix: 'Yüklenici:', key: 'contractor' },
  { prefix: 'Bağlantı:', key: 'link' },
]

const COVER_BY_CATEGORY: Record<string, ContentCover> = {
  Park: COVERS.park,
  Ulaşım: COVERS.projects,
  Altyapı: COVERS.eBelediye,
  Sosyal: COVERS.guide,
  Çevre: COVERS.waste,
  Spor: COVERS.events,
  Kültür: COVERS.culture,
  Eğitim: COVERS.coding,
  Aile: COVERS.announcements,
  Şehircilik: COVERS.news,
  Hizmet: COVERS.eBelediye,
}

const COVER_BY_SLUG: Record<string, ContentCover> = {
  'faaliyet-yesilbayir-park': COVERS.park,
  'faaliyet-durusu-kiyi': COVERS.projects,
  'faaliyet-sazlibosna-bahce': COVERS.park,
  'faaliyet-hadimkoy-asfalt': COVERS.projects,
  'faaliyet-bisiklet': COVERS.projects,
  'faaliyet-boyalik-yol': COVERS.news,
  'faaliyet-carsi-aydinlatma': COVERS.eBelediye,
  'faaliyet-imrahor-su': COVERS.eBelediye,
  'faaliyet-deliklikaya-yagmur': COVERS.waste,
  'faaliyet-tasoluk-sosyal': COVERS.guide,
  'faaliyet-dursunkoy-mahalle': COVERS.guide,
  'faaliyet-bolluca-atik': COVERS.waste,
  'faaliyet-karaburun-temizlik': COVERS.waste,
  'faaliyet-tasoluk-spor': COVERS.events,
  'faaliyet-bogazkoy-genclik': COVERS.rhythm,
  'faaliyet-kultur-fuaye': COVERS.culture,
  'faaliyet-tasoluk-atolyesi': COVERS.coding,
  'faaliyet-kadin-aile': COVERS.announcements,
  'faaliyet-haracci-kentsel': COVERS.news,
  'faaliyet-hadimkoy-vezne': COVERS.eBelediye,
}

export function coverForProject(item: PortalContent): ContentCover {
  return COVER_BY_SLUG[item.slug] ?? COVER_BY_CATEGORY[item.category ?? ''] ?? COVERS.projects
}

export function projectGallery(item: PortalContent): ContentCover[] {
  const primary = coverForProject(item)
  const pool = [COVERS.park, COVERS.projects, COVERS.waste, COVERS.culture, COVERS.guide, COVERS.events, COVERS.coding]
  const seen = new Set([primary.src])
  const extras = pool.filter((cover) => {
    if (seen.has(cover.src)) return false
    seen.add(cover.src)
    return true
  })
  return [primary, ...extras].slice(0, 3)
}

export function pickFeaturedProject(items: PortalContent[]): PortalContent | null {
  if (items.length === 0) return null
  return [...items].sort((a, b) => {
    const extrasA = parseProjectBody(a.body).extras
    const extrasB = parseProjectBody(b.body).extras
    const rank = (id: ProjectStatusId) => (id === 'ongoing' ? 0 : id === 'planning' ? 1 : 2)
    const byStatus = rank(projectStatus(extrasA).id) - rank(projectStatus(extrasB).id)
    if (byStatus !== 0) return byStatus
    return (projectProgress(extrasB) ?? -1) - (projectProgress(extrasA) ?? -1)
  })[0]
}

export function projectVenue(item: PortalContent): EventVenue {
  return venueForLocation(item.location)
}

export { osmEmbedSrc, osmOpenSrc }

export function parseProjectBody(body: string): { paragraphs: string[]; extras: ProjectExtras } {
  const extras: ProjectExtras = {}
  const kept: string[] = []
  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
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
  const paragraphs = kept
    .join('\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
  return { paragraphs, extras }
}

export function projectProgress(extras: ProjectExtras): number | null {
  if (!extras.progress) return null
  const match = extras.progress.match(/(\d{1,3})/)
  if (!match) return null
  return Math.min(100, Math.max(0, Number(match[1])))
}

export function projectStatus(extras: ProjectExtras): { id: ProjectStatusId; label: string } {
  const raw = (extras.status ?? '').toLocaleLowerCase('tr-TR')
  if (raw.includes('tamam')) return { id: 'done', label: extras.status || 'Tamamlandı' }
  if (raw.includes('plan')) return { id: 'planning', label: extras.status || 'Planlama' }
  if (raw.includes('devam') || raw.includes('yapım') || raw.includes('insaat') || raw.includes('inşaat')) {
    return { id: 'ongoing', label: extras.status || 'Devam ediyor' }
  }
  return { id: 'ongoing', label: extras.status || 'Devam ediyor' }
}

export function formatProjectDate(iso: string | null): string {
  if (!iso) return 'Tarih açıklanacak'
  return new Date(iso).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  })
}

export function relatedProjectService(category: string | null): { to: string; label: string } {
  const hay = (category ?? '').toLocaleLowerCase('tr-TR')
  if (hay.includes('ulaş') || hay.includes('ulas')) return { to: '/ulasim-agi', label: 'Ulaşım ağı' }
  if (hay.includes('sosyal') || hay.includes('aile')) return { to: '/yardim', label: 'Sosyal yardım' }
  if (hay.includes('spor')) return { to: '/spor-randevu', label: 'Spor randevu' }
  if (hay.includes('şehircilik') || hay.includes('sehircilik')) return { to: '/imar', label: 'İmar / harç' }
  if (hay.includes('park') || hay.includes('çevre') || hay.includes('cevre')) return { to: '/talepler', label: 'Talep bildir' }
  if (hay.includes('kültür') || hay.includes('kultur')) return { to: '/kultur', label: 'Kültür & sanat' }
  if (hay.includes('hizmet')) return { to: '/e-belediye', label: 'E-Belediye' }
  return { to: '/hizmet-rehberi', label: 'Hizmet rehberi' }
}

export function normalizeProjectHref(raw: string): string {
  const value = raw.trim()
  if (/^https?:\/\//i.test(value)) return value
  return value.startsWith('/') ? value : `/${value.replace(/^\//, '')}`
}

export function projectShareUrl(id: string): string {
  if (typeof window === 'undefined') return `/faaliyetler/${id}`
  return `${window.location.origin}/faaliyetler/${id}`
}

export async function shareProject(item: PortalContent): Promise<'shared' | 'copied'> {
  const url = projectShareUrl(item.id)
  const payload = { title: item.title, text: item.summary, url }
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
