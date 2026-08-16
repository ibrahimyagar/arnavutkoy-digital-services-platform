import type { Neighborhood, PortalContent } from './api'
import { COVERS, type ContentCover } from './contentVisuals'
import { eventStatus, osmEmbedSrc, osmOpenSrc, type EventVenue } from './eventVisuals'

export const CULTURE_CATEGORIES = [
  'Kültür merkezi',
  'Sahne',
  'Kütüphane',
  'Atölye',
  'Sanat alanı',
  'Akademi',
  'Müze',
] as const

export type CultureCategory = (typeof CULTURE_CATEGORIES)[number]

export type CultureExtras = {
  source?: string
  address?: string
  phone?: string
  hours?: string
  services: string[]
  eventSlugs: string[]
  newsSlugs: string[]
}

export type ParsedCulture = {
  paragraphs: string[]
  headings: string[]
  extras: CultureExtras
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const COVER_BY_SLUG: Record<string, ContentCover> = {
  'kultur-avlu34': COVERS.culture,
  'kultur-nuri-pakdil': COVERS.events,
  'kultur-cocuk-atolye': COVERS.coding,
  'kultur-kadin': COVERS.guide,
  'kultur-millet-kiraathane': COVERS.announcements,
  'kultur-cahit-zarifoglu': COVERS.news,
  'kultur-sanat-akademisi': COVERS.events,
  'kultur-yerel-tarih': COVERS.institution,
}

const COVER_BY_CATEGORY: Record<string, ContentCover> = {
  'Kültür merkezi': COVERS.culture,
  Sahne: COVERS.rhythm,
  Kütüphane: COVERS.announcements,
  Atölye: COVERS.coding,
  'Sanat alanı': COVERS.guide,
  Akademi: COVERS.events,
  Müze: COVERS.institution,
}

const VENUE_BY_SLUG: Record<string, EventVenue> = {
  'kultur-avlu34': { lat: 41.1854, lng: 28.7412, label: 'Avlu34 Kültür ve Sanat Merkezi' },
  'kultur-nuri-pakdil': { lat: 41.188, lng: 28.716, label: 'Nuri Pakdil Kültür ve Sanat Merkezi' },
  'kultur-cocuk-atolye': { lat: 41.1856, lng: 28.741, label: 'Çocuk Atölyesi — Avlu34' },
  'kultur-kadin': { lat: 41.1848, lng: 28.7396, label: 'Kadın Kültür ve Sanat Merkezi' },
  'kultur-millet-kiraathane': { lat: 41.1851, lng: 28.7399, label: 'Millet Kıraathanesi ve Şehir Kütüphanesi' },
  'kultur-cahit-zarifoglu': { lat: 41.1915, lng: 28.734, label: 'Cahit Zarifoğlu Millet Kütüphanesi' },
  'kultur-sanat-akademisi': { lat: 41.1882, lng: 28.7162, label: 'Sanat Akademisi — Nuri Pakdil' },
  'kultur-yerel-tarih': { lat: 41.1592, lng: 28.6178, label: 'Yerel Tarih Müzesi — tarihi istasyon' },
}

const EVENT_HINTS: Record<string, string[]> = {
  'kultur-avlu34': ['kültür merkezi', 'avlu'],
  'kultur-nuri-pakdil': ['nuri pakdil', 'taşoluk çok amaçlı'],
  'kultur-cocuk-atolye': ['çocuk atölye'],
  'kultur-sanat-akademisi': ['nuri pakdil'],
}

export const CULTURE_ROUTE = ['kultur-avlu34', 'kultur-nuri-pakdil', 'kultur-yerel-tarih'] as const

export function isCultureId(value: string): boolean {
  return GUID.test(value)
}

export function cultureHref(item: Pick<PortalContent, 'id' | 'slug'>): string {
  return `/kultur/${item.slug || item.id}`
}

export function coverForCulture(item: PortalContent): ContentCover {
  const mapped = COVER_BY_SLUG[item.slug] ?? COVER_BY_CATEGORY[item.category ?? ''] ?? COVERS.culture
  return { src: mapped.src, alt: `${item.title} — kültür mekânı görseli` }
}

export function cultureGallery(item: PortalContent): ContentCover[] {
  const primary = coverForCulture(item)
  return [COVERS.rhythm, COVERS.events, COVERS.institution, COVERS.announcements, COVERS.park]
    .filter((image) => image.src !== primary.src)
    .slice(0, 3)
    .map((image, index) => ({
      src: image.src,
      alt: `${item.title} — mekân görseli ${index + 1}`,
    }))
}

export function venueForCulture(item: PortalContent): EventVenue {
  return VENUE_BY_SLUG[item.slug] ?? { lat: 41.1854, lng: 28.7403, label: item.location || item.title }
}

export { osmEmbedSrc, osmOpenSrc }

export function parseCultureBody(body: string): ParsedCulture {
  const extras: CultureExtras = { services: [], eventSlugs: [], newsSlugs: [] }
  const paragraphs: string[] = []
  const headings: string[] = []

  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('Kaynak:')) extras.source = line.slice(7).trim()
    else if (line.startsWith('Adres:')) extras.address = line.slice(6).trim()
    else if (line.startsWith('Telefon:')) extras.phone = line.slice(8).trim()
    else if (line.startsWith('Saat:')) extras.hours = line.slice(5).trim()
    else if (line.startsWith('Hizmet:')) {
      extras.services = line
        .slice(7)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    } else if (line.startsWith('Etkinlik:')) {
      extras.eventSlugs = line
        .slice(9)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    } else if (line.startsWith('Haber:')) {
      extras.newsSlugs = line
        .slice(6)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    } else if (line.startsWith('## ')) {
      headings.push(line.slice(3).trim())
      paragraphs.push(line)
    } else {
      paragraphs.push(line)
    }
  }

  return { paragraphs, headings, extras }
}

export function searchCulture(item: PortalContent, needle: string): boolean {
  if (!needle) return true
  const extras = parseCultureBody(item.body).extras
  const hay = [item.title, item.summary, item.body, item.category ?? '', item.location ?? '', extras.address ?? '']
    .join(' ')
    .toLocaleLowerCase('tr-TR')
  return hay.includes(needle)
}

export function eventsForVenue(venue: PortalContent, events: PortalContent[]): PortalContent[] {
  const slugs = new Set(parseCultureBody(venue.body).extras.eventSlugs)
  const hints = EVENT_HINTS[venue.slug] ?? []
  return events.filter((event) => {
    if (slugs.has(event.slug)) return true
    const hay = `${event.title} ${event.location ?? ''}`.toLocaleLowerCase('tr-TR')
    return hints.some((hint) => hay.includes(hint))
  })
}

export function upcomingEvents(events: PortalContent[]): PortalContent[] {
  return events
    .filter((event) => eventStatus(event) !== 'past')
    .slice()
    .sort((a, b) => new Date(a.startsAtUtc ?? 0).getTime() - new Date(b.startsAtUtc ?? 0).getTime())
}

export function upcomingCultureEvents(venues: PortalContent[], events: PortalContent[]): PortalContent[] {
  const seen = new Set<string>()
  const related: PortalContent[] = []
  for (const venue of venues) {
    for (const event of eventsForVenue(venue, events)) {
      if (seen.has(event.id)) continue
      seen.add(event.id)
      related.push(event)
    }
  }
  return upcomingEvents(related)
}

export function cultureVenueForEvent(event: PortalContent, venues: PortalContent[]): PortalContent | null {
  return venues.find((venue) => eventsForVenue(venue, [event]).length > 0) ?? null
}

export function cultureVenueForNews(story: PortalContent, venues: PortalContent[]): PortalContent | null {
  return venues.find((venue) => newsForVenue(venue, [story]).length > 0) ?? null
}

export function newsForVenue(venue: PortalContent, news: PortalContent[]): PortalContent[] {
  const slugs = new Set(parseCultureBody(venue.body).extras.newsSlugs)
  const hayNeedles =
    venue.slug === 'kultur-nuri-pakdil' || venue.slug === 'kultur-sanat-akademisi'
      ? ['nuri pakdil']
      : venue.slug === 'kultur-yerel-tarih'
        ? ['yerel tarih', 'tren istasyonu']
        : []
  return news.filter((item) => {
    if (slugs.has(item.slug)) return true
    const hay = `${item.title} ${item.body}`.toLocaleLowerCase('tr-TR')
    return hayNeedles.some((needle) => hay.includes(needle))
  })
}

export function relatedVenues(current: PortalContent, pool: PortalContent[], take = 3): PortalContent[] {
  return pool
    .filter((item) => item.id !== current.id)
    .map((item) => {
      let score = 0
      if (item.category && item.category === current.category) score += 3
      if (item.location && item.location === current.location) score += 4
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.sortOrder - b.item.sortOrder)
    .slice(0, take)
    .map((entry) => entry.item)
}

export function neighborhoodForVenue(item: PortalContent, neighborhoods: Neighborhood[]): Neighborhood | null {
  const name = (item.location ?? '').toLocaleLowerCase('tr-TR')
  if (!name) return null
  return (
    neighborhoods.find((row) => row.name.toLocaleLowerCase('tr-TR') === name) ??
    neighborhoods.find((row) => row.name.toLocaleLowerCase('tr-TR').includes(name)) ??
    null
  )
}

export function phoneHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.length >= 10 ? `tel:${digits}` : null
}

export async function shareCulture(title: string, href: string): Promise<void> {
  const url = `${window.location.origin}${href}`
  if (navigator.share) {
    await navigator.share({ title, url })
    return
  }
  await navigator.clipboard.writeText(url)
}
