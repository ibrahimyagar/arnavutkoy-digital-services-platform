/** Paylaşılan görsel dil — ana sayfa, listeler ve kamu sayfaları aynı kaynak. */

export type ContentCover = {
  src: string
  alt: string
}

export const COVERS = {
  eBelediye: {
    src: '/home/svc-ebelediye.jpg',
    alt: 'E-Belediye dijital hizmetler görseli',
  },
  news: {
    src: '/home/svc-haber.jpg',
    alt: 'Haberler görseli',
  },
  announcements: {
    src: '/home/svc-duyuru.jpg',
    alt: 'Duyurular görseli',
  },
  events: {
    src: '/home/svc-etkinlik.jpg',
    alt: 'Etkinlikler görseli',
  },
  projects: {
    src: '/home/svc-faaliyet.jpg',
    alt: 'Faaliyetler ve yatırımlar görseli',
  },
  culture: {
    src: '/home/svc-kultur.jpg',
    alt: 'Kültür ve sanat görseli',
  },
  guide: {
    src: '/home/svc-rehber.jpg',
    alt: 'Hizmet rehberi görseli',
  },
  mayor: {
    src: '/home/svc-baskan.jpg',
    alt: 'Başkanlık görseli',
  },
  institution: {
    src: '/hero-harbor.jpg',
    alt: 'Kent ve sahil dokusu — kurumsal tanıtım görseli (demo)',
  },
  waste: {
    src: '/home/story-waste.jpg',
    alt: 'Çevre ve atık yönetimi görseli',
  },
  park: {
    src: '/home/story-park.jpg',
    alt: 'Mahalle parkı görseli',
  },
  rhythm: {
    src: '/home/story-rhythm.jpg',
    alt: 'Ritim atölyesi etkinlik görseli',
  },
  coding: {
    src: '/home/story-coding.jpg',
    alt: 'Gençlik kodlama etkinliği görseli',
  },
} as const satisfies Record<string, ContentCover>

export type PortalKind =
  | 'News'
  | 'Event'
  | 'Project'
  | 'CultureVenue'
  | 'ServiceGuide'
  | 'Mayor'
  | 'Corporate'

export function coverForPortalKind(kind: string): ContentCover {
  switch (kind) {
    case 'News':
      return COVERS.news
    case 'Event':
      return COVERS.events
    case 'Project':
      return COVERS.projects
    case 'CultureVenue':
      return COVERS.culture
    case 'ServiceGuide':
      return COVERS.guide
    case 'Mayor':
      return COVERS.mayor
    case 'Corporate':
      return COVERS.institution
    default:
      return COVERS.eBelediye
  }
}

export function coverForModuleId(id: string): ContentCover | undefined {
  const map: Record<string, ContentCover> = {
    'e-belediye': COVERS.eBelediye,
    news: COVERS.news,
    announcements: COVERS.announcements,
    events: COVERS.events,
    projects: COVERS.projects,
    culture: COVERS.culture,
    'service-guide': COVERS.guide,
    mayor: COVERS.mayor,
    corporate: COVERS.institution,
  }
  return map[id]
}

export type RelatedPage = {
  to: string
  label: string
  hint: string
  group: string
}

const RELATED_COVERS: { match: string; cover: ContentCover }[] = [
  { match: '/haberler', cover: COVERS.news },
  { match: '/duyurular', cover: COVERS.announcements },
  { match: '/etkinlikler', cover: COVERS.events },
  { match: '/faaliyetler', cover: COVERS.projects },
  { match: '/kultur', cover: COVERS.culture },
  { match: '/hizmet-rehberi', cover: COVERS.guide },
  { match: '/e-belediye', cover: COVERS.eBelediye },
  { match: '/vezne', cover: COVERS.eBelediye },
  { match: '/basvuru-takip', cover: COVERS.eBelediye },
  { match: '/basvurular', cover: COVERS.eBelediye },
  { match: '/baskan', cover: COVERS.mayor },
  { match: '/kurumsal', cover: COVERS.institution },
  { match: '/birimler', cover: COVERS.mayor },
  { match: '/muhtarliklar', cover: COVERS.guide },
  { match: '/iletisim', cover: COVERS.guide },
  { match: '/ulasim-agi', cover: COVERS.projects },
  { match: '/hatlar', cover: COVERS.projects },
  { match: '/ulasim', cover: COVERS.projects },
  { match: '/binis', cover: COVERS.projects },
  { match: '/imar', cover: COVERS.news },
  { match: '/spor-randevu', cover: COVERS.events },
  { match: '/yardim', cover: COVERS.guide },
  { match: '/talepler', cover: COVERS.announcements },
]

const RELATED_GROUPS: { match: string; group: string }[] = [
  { match: '/haberler', group: 'Haberler' },
  { match: '/duyurular', group: 'Duyurular' },
  { match: '/etkinlikler', group: 'Etkinlikler' },
  { match: '/faaliyetler', group: 'Faaliyetler' },
  { match: '/kultur', group: 'Hizmetler' },
  { match: '/hizmet-rehberi', group: 'Hizmetler' },
  { match: '/e-belediye', group: 'Vatandaş işlemleri' },
  { match: '/vezne', group: 'Vatandaş işlemleri' },
  { match: '/basvuru-takip', group: 'Vatandaş işlemleri' },
  { match: '/basvurular', group: 'Vatandaş işlemleri' },
  { match: '/iletisim', group: 'İletişim' },
  { match: '/baskan', group: 'Kurumsal' },
  { match: '/kurumsal', group: 'Kurumsal' },
  { match: '/birimler', group: 'Kurumsal' },
  { match: '/muhtarliklar', group: 'Kurumsal' },
  { match: '/ulasim-agi', group: 'Hizmetler' },
  { match: '/ulasim', group: 'Hizmetler' },
  { match: '/hatlar', group: 'Hizmetler' },
  { match: '/binis', group: 'Hizmetler' },
  { match: '/imar', group: 'Hizmetler' },
  { match: '/spor-randevu', group: 'Hizmetler' },
  { match: '/yardim', group: 'Vatandaş işlemleri' },
  { match: '/talepler', group: 'Vatandaş işlemleri' },
]

export function coverForRelatedPath(to: string): ContentCover {
  const found = RELATED_COVERS.find((entry) => to === entry.match || to.startsWith(`${entry.match}/`))
  return found?.cover ?? COVERS.eBelediye
}

export function groupForRelatedPath(to: string, fallback?: string): string {
  if (fallback) return fallback
  const found = RELATED_GROUPS.find((entry) => to === entry.match || to.startsWith(`${entry.match}/`))
  return found?.group ?? 'Hizmetler'
}

export const RELATED = {
  municipal: [
    { to: '/kurumsal', label: 'Kurumsal', hint: 'Organizasyon ve birim yapısı', group: 'Kurumsal' },
    { to: '/baskan', label: 'Başkan', hint: 'Kurumsal mesaj ve iletişim', group: 'Kurumsal' },
    { to: '/birimler', label: 'Birimler', hint: 'Müdürlük ve daire dizini', group: 'Kurumsal' },
    { to: '/muhtarliklar', label: 'Muhtarlıklar', hint: 'Mahalle mahalle keşif ve muhtar hattı', group: 'Kurumsal' },
  ],
  directory: [
    { to: '/baskan', label: 'Başkan', hint: 'Kurumsal mesaj ve iletişim', group: 'Kurumsal' },
    { to: '/kurumsal', label: 'Kurumsal', hint: 'Organizasyon ve birim yapısı', group: 'Kurumsal' },
    { to: '/hizmet-rehberi', label: 'Hizmetler', hint: 'Başvuru ve işlem kanalları', group: 'Hizmetler' },
    { to: '/faaliyetler', label: 'Faaliyetler', hint: 'Park, yol ve yatırım defteri', group: 'Faaliyetler' },
    { to: '/duyurular', label: 'Duyurular', hint: 'Resmi bildirim ve duyurular', group: 'Duyurular' },
    { to: '/iletisim', label: 'İletişim', hint: 'Çağrı merkezi ve yazışma', group: 'İletişim' },
  ],
  media: [
    { to: '/haberler', label: 'Haberler', hint: 'İlçeden güncel haber akışı', group: 'Haberler' },
    { to: '/duyurular', label: 'Duyurular', hint: 'Resmi bildirim ve duyurular', group: 'Duyurular' },
    { to: '/etkinlikler', label: 'Etkinlikler', hint: 'Kültür, spor ve açık hava takvimi', group: 'Etkinlikler' },
    { to: '/faaliyetler', label: 'Faaliyetler', hint: 'Park, yol ve yatırım defteri', group: 'Faaliyetler' },
  ],
  investments: [
    { to: '/haberler', label: 'Haberler', hint: 'Saha ve açılış haberleri', group: 'Haberler' },
    { to: '/etkinlikler', label: 'Etkinlikler', hint: 'Açılış ve program duyuruları', group: 'Etkinlikler' },
    { to: '/ulasim-agi', label: 'Ulaşım ağı', hint: 'Hat, güzergâh ve kart işlemleri', group: 'Hizmetler' },
    { to: '/hizmet-rehberi', label: 'Hizmet rehberi', hint: 'Başvuru ve işlem kanalları', group: 'Hizmetler' },
  ],
  eServices: [
    { to: '/e-belediye', label: 'E-Belediye', hint: 'Tüm dijital işlemler tek yerde', group: 'Vatandaş işlemleri' },
    { to: '/basvuru-takip', label: 'Başvuru takibi', hint: 'Takip kodu ile durum sorgula', group: 'Vatandaş işlemleri' },
    { to: '/vezne', label: 'Dijital vezne', hint: 'Vergi ve su ödemesi', group: 'Vatandaş işlemleri' },
    { to: '/iletisim', label: 'İletişim', hint: 'Çağrı merkezi ve yazışma', group: 'İletişim' },
  ],
  transport: [
    { to: '/hatlar', label: 'Ulaşım rehberi', hint: 'Hat, güzergâh ve durak uçları', group: 'Hizmetler' },
    { to: '/ulasim-agi', label: 'Ulaşım ağı', hint: 'Hat ve kart işlem merkezi', group: 'Hizmetler' },
    { to: '/ulasim', label: 'Ulaşım kartı', hint: 'Bakiye ve kart işlemleri', group: 'Vatandaş işlemleri' },
    { to: '/binis', label: 'Biniş simülasyonu', hint: 'Demo kart okutma', group: 'Hizmetler' },
  ],
} as const satisfies Record<string, readonly RelatedPage[]>
