import type { PortalContent } from './api'
import { COVERS, type ContentCover } from './contentVisuals'

export const EVENT_CATEGORIES = ['Kültür', 'Spor', 'Müzik', 'Eğitim', 'Açık hava', 'Çocuk'] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export type EventVenue = {
  lat: number
  lng: number
  label: string
}

export type EventExtras = {
  fee?: string
  audience?: string
  quota?: string
  signup?: string
  program?: string
}

const EXTRA_FIELDS: { prefix: string; key: keyof EventExtras }[] = [
  { prefix: 'Ücret:', key: 'fee' },
  { prefix: 'Katılım:', key: 'signup' },
  { prefix: 'Yaş:', key: 'audience' },
  { prefix: 'Kontenjan:', key: 'quota' },
  { prefix: 'Program:', key: 'program' },
]

const COVER_BY_CATEGORY: Record<string, ContentCover> = {
  Kültür: COVERS.culture,
  Spor: COVERS.park,
  Müzik: COVERS.rhythm,
  Eğitim: COVERS.coding,
  'Açık hava': COVERS.events,
  Çocuk: COVERS.coding,
}

const VENUES: { match: string; venue: EventVenue }[] = [
  { match: 'yeşilbayır', venue: { lat: 41.213, lng: 28.752, label: 'Yeşilbayır' } },
  { match: 'yesilbayir', venue: { lat: 41.213, lng: 28.752, label: 'Yeşilbayır' } },
  { match: 'durusu', venue: { lat: 41.316, lng: 28.675, label: 'Durusu / Terkos sahil bandı' } },
  { match: 'karaburun', venue: { lat: 41.342, lng: 28.683, label: 'Karaburun sahil' } },
  { match: 'boğazköy', venue: { lat: 41.205, lng: 28.758, label: 'Boğazköy spor alanı' } },
  { match: 'bogazkoy', venue: { lat: 41.205, lng: 28.758, label: 'Boğazköy spor alanı' } },
  { match: 'hadımköy', venue: { lat: 41.156, lng: 28.618, label: 'Hadımköy' } },
  { match: 'hadimkoy', venue: { lat: 41.156, lng: 28.618, label: 'Hadımköy' } },
  { match: 'taşoluk', venue: { lat: 41.188, lng: 28.716, label: 'Taşoluk' } },
  { match: 'tasoluk', venue: { lat: 41.188, lng: 28.716, label: 'Taşoluk' } },
  { match: 'bolluca', venue: { lat: 41.204, lng: 28.738, label: 'Bolluca' } },
  { match: 'haraççı', venue: { lat: 41.183, lng: 28.701, label: 'Haraççı' } },
  { match: 'haracci', venue: { lat: 41.183, lng: 28.701, label: 'Haraççı' } },
  { match: 'imrahor', venue: { lat: 41.198, lng: 28.768, label: 'İmrahor' } },
  { match: 'boyalık', venue: { lat: 41.172, lng: 28.790, label: 'Boyalık' } },
  { match: 'boyalik', venue: { lat: 41.172, lng: 28.790, label: 'Boyalık' } },
  { match: 'deliklikaya', venue: { lat: 41.163, lng: 28.745, label: 'Deliklikaya' } },
  { match: 'sazlıbosna', venue: { lat: 41.148, lng: 28.680, label: 'Sazlıbosna' } },
  { match: 'sazlibosna', venue: { lat: 41.148, lng: 28.680, label: 'Sazlıbosna' } },
  { match: 'dursunköy', venue: { lat: 41.225, lng: 28.710, label: 'Dursunköy' } },
  { match: 'dursunkoy', venue: { lat: 41.225, lng: 28.710, label: 'Dursunköy' } },
  { match: 'kültür merkezi', venue: { lat: 41.1854, lng: 28.7412, label: 'Avlu34 Kültür ve Sanat Merkezi' } },
  { match: 'kultur merkezi', venue: { lat: 41.1854, lng: 28.7412, label: 'Avlu34 Kültür ve Sanat Merkezi' } },
  { match: 'çarşı', venue: { lat: 41.1854, lng: 28.7403, label: 'Arnavutköy Merkez çarşı' } },
  { match: 'carsi', venue: { lat: 41.1854, lng: 28.7403, label: 'Arnavutköy Merkez çarşı' } },
  { match: 'merkez', venue: { lat: 41.1854, lng: 28.7403, label: 'Arnavutköy Merkez Meydan' } },
]

const COVER_BY_SLUG: Record<string, ContentCover> = {
  'etkinlik-sinema': COVERS.park,
  'etkinlik-sahil': COVERS.park,
  'etkinlik-tiyatro': COVERS.culture,
}

export function coverForEvent(item: PortalContent): ContentCover {
  const bySlug = COVER_BY_SLUG[item.slug]
  if (bySlug) return bySlug
  const category = item.category ?? ''
  return COVER_BY_CATEGORY[category] ?? COVERS.events
}

export function venueForLocation(location: string | null): EventVenue {
  const hay = (location ?? '').toLocaleLowerCase('tr-TR')
  const found = VENUES.find((entry) => hay.includes(entry.match))
  return found?.venue ?? { lat: 41.1854, lng: 28.7403, label: location || 'Arnavutköy' }
}

export function osmEmbedSrc(venue: EventVenue): string {
  const padLng = 0.035
  const padLat = 0.022
  const bbox = `${venue.lng - padLng},${venue.lat - padLat},${venue.lng + padLng},${venue.lat + padLat}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${venue.lat}%2C${venue.lng}`
}

export function osmOpenSrc(venue: EventVenue): string {
  return `https://www.openstreetmap.org/?mlat=${venue.lat}&mlon=${venue.lng}#map=14/${venue.lat}/${venue.lng}`
}

export function parseEventBody(body: string): { paragraphs: string[]; extras: EventExtras } {
  const extras: EventExtras = {}
  const kept: string[] = []
  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    const field = EXTRA_FIELDS.find((item) =>
      line.toLocaleLowerCase('tr-TR').startsWith(item.prefix.toLocaleLowerCase('tr-TR')),
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

export function hasEventExtras(extras: EventExtras): boolean {
  return Boolean(extras.fee || extras.audience || extras.quota || extras.signup || extras.program)
}

export function hasParticipationNotes(extras: EventExtras): boolean {
  return Boolean(extras.fee || extras.audience || extras.quota || extras.signup)
}

export function eventAgenda(
  item: PortalContent,
  extras: EventExtras,
): { time: string; label: string }[] {
  if (extras.program) {
    return extras.program
      .split('·')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const split = part.split(/\s+[–—-]\s+/)
        if (split.length === 2) return { time: split[0], label: split[1] }
        return { time: '', label: part }
      })
  }

  const rows: { time: string; label: string }[] = []
  if (item.startsAtUtc) rows.push({ time: formatEventClock(item.startsAtUtc), label: 'Başlangıç' })
  if (item.endsAtUtc) rows.push({ time: formatEventClock(item.endsAtUtc), label: 'Bitiş' })
  return rows
}

export function formatEventDate(iso: string | null): string {
  if (!iso) return 'Tarih açıklanacak'
  return new Date(iso).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatEventClock(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function formatEventTimeRange(start: string | null, end: string | null): string {
  if (!start) return 'Saat açıklanacak'
  const from = formatEventClock(start)
  if (!end) return from
  return `${from} – ${formatEventClock(end)}`
}

export function formatEventStamp(iso: string | null): { day: string; month: string } {
  if (!iso) return { day: '—', month: '' }
  const date = new Date(iso)
  return {
    day: date.toLocaleDateString('tr-TR', { day: '2-digit' }),
    month: date.toLocaleDateString('tr-TR', { month: 'short' }),
  }
}

export function eventStatus(item: PortalContent, now = new Date()): 'upcoming' | 'live' | 'past' {
  const start = item.startsAtUtc ? new Date(item.startsAtUtc) : null
  const end = item.endsAtUtc ? new Date(item.endsAtUtc) : start
  if (start && start > now) return 'upcoming'
  if (end && end < now) return 'past'
  if (start) return 'live'
  return 'upcoming'
}

export function relatedServiceHref(item: PortalContent): { to: string; label: string } | null {
  const category = (item.category ?? '').toLocaleLowerCase('tr-TR')
  if (category === 'spor') return { to: '/spor-randevu', label: 'Spor tesisi randevusu' }
  return null
}

function icsStamp(iso: string | null, fallbackHours: number): string {
  const date = iso ? new Date(iso) : new Date()
  if (!iso) date.setHours(date.getHours() + fallbackHours)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildEventIcs(item: PortalContent): string {
  const uid = `${item.slug || item.id}@arnavutkoy.demo`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arnavutkoy Demo//Events//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsStamp(new Date().toISOString(), 0)}`,
    `DTSTART:${icsStamp(item.startsAtUtc, 0)}`,
    `DTEND:${icsStamp(item.endsAtUtc, 2)}`,
    `SUMMARY:${icsEscape(item.title)}`,
    `DESCRIPTION:${icsEscape(item.summary)}`,
    item.location ? `LOCATION:${icsEscape(item.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

export function downloadEventIcs(item: PortalContent) {
  const blob = new Blob([buildEventIcs(item)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${item.slug || 'etkinlik'}.ics`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function googleCalendarUrl(item: PortalContent): string {
  const start = icsStamp(item.startsAtUtc, 0)
  const end = icsStamp(item.endsAtUtc, 2)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${start}/${end}`,
    details: item.summary,
  })
  if (item.location) params.set('location', item.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function eventShareUrl(eventId: string): string {
  if (typeof window === 'undefined') return `/etkinlikler/${eventId}`
  return `${window.location.origin}/etkinlikler/${eventId}`
}

export async function shareEvent(item: PortalContent): Promise<'shared' | 'copied'> {
  const url = eventShareUrl(item.id)
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
      /* fall through to execCommand */
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
