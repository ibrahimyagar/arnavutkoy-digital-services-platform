import { osmEmbedSrc, osmOpenSrc, type EventVenue } from './eventVisuals'

/** TÜİK ADNKS yılı. 2026 yayımlanınca seed + bu sabit birlikte güncellenir. */
export const POPULATION_YEAR = 2025

/** Resmi ilçe toplamı (TÜİK ADNKS 2025). Listedeki mahalle SUM’u ile karşılaştırılır; hard-code istatistik değildir. */
export const DISTRICT_POPULATION_ADNKS = 358_469

export const DATA_SOURCES = {
  population: 'TÜİK / ADNKS 2025',
  headmen: 'T.C. Arnavutköy Belediyesi e-Rehber — Muhtarlarımız',
  lastVerified: '2026-08-16',
} as const

export const LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('')

export type ExploreRegion = 'merkez' | 'bati' | 'bogazkoy' | 'sahil' | 'kirsal'

export type DensityFilter = 'all' | 'dense' | 'mid' | 'quiet'

type Coord = { lat: number; lng: number }

/**
 * Yaklaşık OSM işaretleri — kadastro sınırı değildir.
 * Mevcut etkinlik/faaliyet venue’ları ile aynı ilçe referansına dayanır.
 */
const COORDS: Record<string, Coord> = {
  'Adnan Menderes': { lat: 41.1828, lng: 28.7362 },
  Anadolu: { lat: 41.1912, lng: 28.7468 },
  'Arnavutköy Merkez': { lat: 41.1854, lng: 28.7403 },
  Atatürk: { lat: 41.2038, lng: 28.7564 },
  Baklalı: { lat: 41.2584, lng: 28.7182 },
  Balaban: { lat: 41.2761, lng: 28.7044 },
  'Boğazköy İstiklal': { lat: 41.205, lng: 28.758 },
  Bolluca: { lat: 41.204, lng: 28.738 },
  Boyalık: { lat: 41.172, lng: 28.79 },
  Çilingir: { lat: 41.2214, lng: 28.7782 },
  Deliklikaya: { lat: 41.163, lng: 28.745 },
  Dursunköy: { lat: 41.225, lng: 28.71 },
  Durusu: { lat: 41.316, lng: 28.675 },
  Fatih: { lat: 41.1786, lng: 28.7488 },
  Hacımaşlı: { lat: 41.2412, lng: 28.6924 },
  Hadımköy: { lat: 41.156, lng: 28.618 },
  Haraççı: { lat: 41.183, lng: 28.701 },
  Hastane: { lat: 41.1876, lng: 28.7318 },
  Hicret: { lat: 41.1924, lng: 28.7286 },
  İmrahor: { lat: 41.198, lng: 28.768 },
  İslambey: { lat: 41.1812, lng: 28.7426 },
  Karaburun: { lat: 41.342, lng: 28.683 },
  Karlıbayır: { lat: 41.175, lng: 28.725 },
  'Mareşal Fevzi Çakmak': { lat: 41.1948, lng: 28.7512 },
  Mavigöl: { lat: 41.2006, lng: 28.7348 },
  'Mehmet Akif Ersoy': { lat: 41.1884, lng: 28.7552 },
  'Mustafa Kemal Paşa': { lat: 41.1698, lng: 28.7284 },
  Nenehatun: { lat: 41.1802, lng: 28.7518 },
  Ömerli: { lat: 41.1648, lng: 28.6986 },
  Sazlıbosna: { lat: 41.148, lng: 28.68 },
  Taşoluk: { lat: 41.188, lng: 28.716 },
  Tayakadın: { lat: 41.2984, lng: 28.7216 },
  Terkos: { lat: 41.32, lng: 28.67 },
  Yassıören: { lat: 41.2688, lng: 28.7482 },
  'Yavuz Selim': { lat: 41.1982, lng: 28.7484 },
  Yeniköy: { lat: 41.2526, lng: 28.7324 },
  Yeşilbayır: { lat: 41.213, lng: 28.752 },
  'Yunus Emre': { lat: 41.2076, lng: 28.7612 },
}

export const OFFICIAL_NEIGHBORHOOD_NAMES = Object.keys(COORDS)

const OFFICIAL_SET = new Set(OFFICIAL_NEIGHBORHOOD_NAMES.map((name) => name.toLocaleLowerCase('tr-TR')))

export const REGIONS: { id: ExploreRegion; label: string; hint: string; names: string[] }[] = [
  {
    id: 'merkez',
    label: 'Merkez',
    hint: 'Çarşı ve yakın mahalleler',
    names: [
      'Arnavutköy Merkez',
      'İslambey',
      'Anadolu',
      'Fatih',
      'Hastane',
      'Hicret',
      'Nenehatun',
      'Adnan Menderes',
    ],
  },
  {
    id: 'bati',
    label: 'Batı koridor',
    hint: 'Hadımköy–Taşoluk hattı',
    names: ['Hadımköy', 'Taşoluk', 'Haraççı', 'Karlıbayır', 'Mustafa Kemal Paşa', 'Ömerli'],
  },
  {
    id: 'bogazkoy',
    label: 'Boğazköy bandı',
    hint: 'İstiklal ve çevresi',
    names: [
      'Boğazköy İstiklal',
      'Atatürk',
      'Yunus Emre',
      'Mavigöl',
      'Yavuz Selim',
      'İmrahor',
      'Bolluca',
      'Deliklikaya',
      'Mareşal Fevzi Çakmak',
      'Mehmet Akif Ersoy',
    ],
  },
  {
    id: 'sahil',
    label: 'Kuzey / sahil',
    hint: 'Terkos–Karaburun yakası',
    names: ['Durusu', 'Terkos', 'Karaburun', 'Tayakadın', 'Yeniköy', 'Yassıören', 'Balaban'],
  },
  {
    id: 'kirsal',
    label: 'Kırsal doku',
    hint: 'Düşük yoğunluklu mahalleler',
    names: ['Baklalı', 'Boyalık', 'Hacımaşlı', 'Yeşilbayır', 'Dursunköy', 'Sazlıbosna', 'Çilingir'],
  },
]

export function isOfficialNeighborhood(name: string): boolean {
  return OFFICIAL_SET.has(name.trim().toLocaleLowerCase('tr-TR'))
}

export function regionForName(name: string): ExploreRegion {
  const found = REGIONS.find((region) => region.names.includes(name))
  return found?.id ?? 'merkez'
}

export function regionLabel(name: string): string {
  const id = regionForName(name)
  return REGIONS.find((region) => region.id === id)?.label ?? 'Merkez'
}

export function venueForNeighborhood(name: string): EventVenue {
  const coord = COORDS[name] ?? { lat: 41.1854, lng: 28.7403 }
  return { ...coord, label: name }
}

export function neighborhoodOsmSrc(name: string): string {
  return osmEmbedSrc(venueForNeighborhood(name))
}

export function neighborhoodOsmOpen(name: string): string {
  return osmOpenSrc(venueForNeighborhood(name))
}

export function densityOf(population: number): Exclude<DensityFilter, 'all'> {
  if (population >= 15_000) return 'dense'
  if (population >= 3_000) return 'mid'
  return 'quiet'
}

export function densityLabel(population: number): string {
  const kind = densityOf(population)
  if (kind === 'dense') return 'Kalabalık'
  if (kind === 'mid') return 'Orta yoğunluk'
  return 'Sakin / kırsal'
}

export function matchesDensity(population: number, filter: DensityFilter): boolean {
  return filter === 'all' || densityOf(population) === filter
}

export function toTelHref(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length >= 12) return `tel:+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `tel:+90${digits.slice(1)}`
  if (digits.length === 10) return `tel:+90${digits}`
  return raw ? `tel:${raw}` : ''
}

export function formatPhoneTr(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('90')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits
  if (local.length === 10) {
    return `+90 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`
  }
  return raw || '—'
}

export function shareNeighborhood(id: string, name: string): Promise<void> {
  const url = `${window.location.origin}/muhtarliklar/${id}`
  if (navigator.share) {
    return navigator.share({ title: `${name} · Arnavutköy mahalle rehberi`, url }).then(() => undefined)
  }
  return navigator.clipboard.writeText(url)
}
