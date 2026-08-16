import type { BusLine, BusLineStop } from './api'

export const IETT_ROUTE = (code: string) =>
  `https://iett.istanbul/RouteDetail?hkod=${encodeURIComponent(code)}`

export const IETT_TARIFF = 'https://iett.istanbul/icerik/IETT-Toplu-Ulasim-ucret-Tarifesi'

export const CATALOG_LIST_DATE = '24 Ocak 2021'
export const CATALOG_CHECKED = 'Ağustos 2026'

export type LineKind = 'Normal' | 'Besleme' | 'Ekspres'

export type ParsedLine = {
  route: string
  origin?: string
  destination?: string
  kind?: LineKind
  tariff?: string
  durationMin?: number
  source?: string
  listDate?: string
  neighborhoods: string[]
  note?: string
}

const KIND_SET = new Set<string>(['Normal', 'Besleme', 'Ekspres'])

export function parseLineSummary(summary: string): ParsedLine {
  const parsed: ParsedLine = { route: '', neighborhoods: [] }
  const extras: string[] = []

  for (const raw of summary.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('Tür:')) {
      const value = line.slice(4).trim()
      if (KIND_SET.has(value)) parsed.kind = value as LineKind
    } else if (line.startsWith('Tarife:')) parsed.tariff = line.slice(7).trim()
    else if (line.startsWith('Süre:')) {
      const match = line.slice(5).trim().match(/^(\d+)/)
      if (match) parsed.durationMin = Number(match[1])
    } else if (line.startsWith('Kaynak:')) parsed.source = line.slice(7).trim()
    else if (line.startsWith('Liste:')) parsed.listDate = line.slice(6).trim()
    else if (line.startsWith('Mahalle:')) {
      parsed.neighborhoods = line
        .slice(8)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    } else if (line.startsWith('Not:')) parsed.note = line.slice(4).trim()
    else extras.push(line)
  }

  parsed.route = extras[0] ?? ''
  const arrow = parsed.route.split('→').map((part) => part.trim()).filter(Boolean)
  if (arrow.length >= 2) {
    parsed.origin = arrow[0]
    parsed.destination = arrow[arrow.length - 1]
  }
  return parsed
}

export function lineHaystack(line: BusLine, extraStops: string[] = []): string {
  const parsed = parseLineSummary(line.routeSummary)
  return [
    line.code,
    line.name,
    parsed.route,
    parsed.origin ?? '',
    parsed.destination ?? '',
    parsed.kind ?? '',
    parsed.tariff ?? '',
    ...parsed.neighborhoods,
    ...extraStops,
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR')
}

function foldQuery(value: string) {
  return value.toLocaleLowerCase('tr-TR').replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim()
}

function compactQuery(value: string) {
  return foldQuery(value).replace(/ /g, '')
}

export function searchLine(line: BusLine, needle: string, extraStops: string[] = []): boolean {
  if (!needle) return true
  const hay = foldQuery(lineHaystack(line, extraStops))
  const folded = foldQuery(needle)
  if (hay.includes(folded)) return true
  const compactHay = compactQuery(hay)
  const compactNeedle = compactQuery(folded)
  if (compactNeedle.length >= 4 && compactHay.includes(compactNeedle)) return true
  if (folded.includes('arnavutköy merkez') || folded.includes('arnavutkoy merkez')) {
    return hay.includes('arnavutköy') || hay.includes('arnavutkoy')
  }
  return false
}

export function presentKinds(lines: BusLine[]): LineKind[] {
  const seen = new Set<LineKind>()
  for (const line of lines) {
    const kind = parseLineSummary(line.routeSummary).kind
    if (kind) seen.add(kind)
  }
  return (['Normal', 'Besleme', 'Ekspres'] as const).filter((kind) => seen.has(kind))
}

export function presentNeighborhoods(lines: BusLine[]): string[] {
  const seen = new Set<string>()
  for (const line of lines) {
    for (const name of parseLineSummary(line.routeSummary).neighborhoods) seen.add(name)
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'tr'))
}

export function presentPlaces(lines: BusLine[]): string[] {
  const seen = new Set<string>()
  for (const line of lines) {
    const parsed = parseLineSummary(line.routeSummary)
    if (parsed.origin) seen.add(parsed.origin)
    if (parsed.destination) seen.add(parsed.destination)
  }
  return [...seen].sort((a, b) => a.localeCompare(b, 'tr'))
}

export function matchesPlace(line: BusLine, place: string): boolean {
  if (!place) return true
  const needle = place.toLocaleLowerCase('tr-TR')
  return lineHaystack(line).includes(needle)
}

export function sortedStops(stops: BusLineStop[]): BusLineStop[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence)
}

export function iettHref(code: string): string {
  return IETT_ROUTE(code)
}

export function isExactCode(line: BusLine, query: string): boolean {
  return line.code.toLocaleLowerCase('tr-TR') === query.trim().toLocaleLowerCase('tr-TR')
}

export type LineSort = 'code' | 'duration' | 'durationDesc' | 'name'

export function sortLines(lines: BusLine[], sort: LineSort, query = ''): BusLine[] {
  return [...lines].sort((a, b) => {
    const exactA = isExactCode(a, query) ? 0 : 1
    const exactB = isExactCode(b, query) ? 0 : 1
    if (exactA !== exactB) return exactA - exactB
    if (sort === 'duration' || sort === 'durationDesc') {
      const da = parseLineSummary(a.routeSummary).durationMin ?? 9999
      const db = parseLineSummary(b.routeSummary).durationMin ?? 9999
      if (da !== db) return sort === 'duration' ? da - db : db - da
    }
    if (sort === 'name') return a.name.localeCompare(b.name, 'tr')
    return a.code.localeCompare(b.code, 'tr', { numeric: true })
  })
}

/** Public OSM / Wikipedia coordinates for landmarks — not bus-stop GPS. */
export const LANDMARKS = [
  { label: 'Arnavutköy', lat: 41.1839, lng: 28.7408, hint: 'İlçe merkezi' },
  { label: 'İstanbul Havalimanı', lat: 41.2622, lng: 28.7483, hint: 'H-6' },
  { label: 'Eminönü', lat: 41.0172, lng: 28.9703, hint: '336' },
  { label: 'Yenikapı', lat: 41.0053, lng: 28.9514, hint: '36Y' },
  { label: 'Mahmutbey Metro', lat: 41.0516, lng: 28.8253, hint: '144M' },
  { label: 'Metrokent', lat: 41.1075, lng: 28.8042, hint: 'MK22' },
  { label: 'Sefaköy Metrobüs', lat: 40.9978, lng: 28.797, hint: '36AS' },
] as const

export const TRANSFER_POINTS = LANDMARKS.filter((point) => point.label !== 'Arnavutköy')

export function matchLandmark(name: string | undefined) {
  if (!name) return undefined
  const needle = name.toLocaleLowerCase('tr-TR')
  return LANDMARKS.find(
    (point) =>
      needle.includes(point.label.toLocaleLowerCase('tr-TR')) ||
      point.label.toLocaleLowerCase('tr-TR').includes(needle),
  )
}
