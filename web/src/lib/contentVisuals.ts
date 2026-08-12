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
      return COVERS.guide
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
  }
  return map[id]
}

export const RELATED = {
  municipal: [
    { to: '/kurumsal', label: 'Kurumsal', hint: 'Organizasyon özeti' },
    { to: '/baskan', label: 'Başkan', hint: 'Kurumsal mesaj' },
    { to: '/birimler', label: 'Birimler', hint: 'Departman dizini' },
    { to: '/muhtarliklar', label: 'Muhtarlıklar', hint: 'Mahalle iletişimi' },
  ],
  media: [
    { to: '/haberler', label: 'Haberler', hint: 'Güncel haber akışı' },
    { to: '/duyurular', label: 'Duyurular', hint: 'Bildirimler' },
    { to: '/etkinlikler', label: 'Etkinlikler', hint: 'Takvim' },
    { to: '/faaliyetler', label: 'Faaliyetler', hint: 'Projeler' },
  ],
  eServices: [
    { to: '/e-belediye', label: 'E-Belediye', hint: 'Tüm işlemler' },
    { to: '/basvuru-takip', label: 'Başvuru takibi', hint: 'Takip kodu' },
    { to: '/vezne', label: 'Dijital vezne', hint: 'Ödeme' },
    { to: '/iletisim', label: 'İletişim', hint: 'Destek' },
  ],
  transport: [
    { to: '/hatlar', label: 'Otobüs hatları', hint: 'Güzergâh listesi' },
    { to: '/ulasim-agi', label: 'Ulaşım ağı', hint: 'Hat ve kart hub' },
    { to: '/ulasim', label: 'Ulaşım kartı', hint: 'Bakiye' },
    { to: '/binis', label: 'Biniş simülasyonu', hint: 'Demo biniş' },
  ],
} as const
