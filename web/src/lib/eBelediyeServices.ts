export const SERVICE_CATEGORIES = [
  'Vergi & ödemeler',
  'Başvuru & belgeler',
  'İmar & şehircilik',
  'Nikah & aile',
  'Spor & tesisler',
  'Sosyal hizmetler',
  'Ulaşım',
  'Rehber & destek',
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

export type ServiceKind = 'Ödeme' | 'Başvuru' | 'Sorgulama' | 'Randevu' | 'Belge' | 'Takip' | 'Destek'

export type ServiceIcon =
  | 'pay'
  | 'track'
  | 'debt'
  | 'doc'
  | 'ring'
  | 'plot'
  | 'sport'
  | 'help'
  | 'bus'
  | 'guide'
  | 'desk'
  | 'aid'

export type DigitalService = {
  id: string
  title: string
  blurb: string
  to: string
  category: ServiceCategory
  kind: ServiceKind
  keywords: string[]
  requiresAuth: boolean
  featured?: boolean
  quick?: boolean
  icon: ServiceIcon
}

/** Çalışan route’lara bağlı katalog — uydurma hizmet yok. */
export const DIGITAL_SERVICES: DigitalService[] = [
  {
    id: 'vezne',
    title: 'Dijital vezne',
    blurb: 'Açık borç ve kart bakiyesi için demo ödeme masası. Gerçek tahsilat yoktur.',
    to: '/vezne',
    category: 'Vergi & ödemeler',
    kind: 'Ödeme',
    keywords: ['vergi', 'ödeme', 'vezne', 'emlak', 'su', 'kart', 'bakiye'],
    requiresAuth: true,
    featured: true,
    quick: true,
    icon: 'pay',
  },
  {
    id: 'borclar',
    title: 'Borç sorgula',
    blurb: 'Su ve emlak borçlarınızı hesabınız üzerinden görün.',
    to: '/borclar',
    category: 'Vergi & ödemeler',
    kind: 'Sorgulama',
    keywords: ['borç', 'vergi', 'emlak', 'su', 'ödenmedi', 'sorgula'],
    requiresAuth: true,
    quick: true,
    icon: 'debt',
  },
  {
    id: 'takip',
    title: 'Başvuru takibi',
    blurb: 'BV-, SP- veya NK- kodu ile belge, spor ve nikah durumunu sorun.',
    to: '/basvuru-takip',
    category: 'Başvuru & belgeler',
    kind: 'Takip',
    keywords: ['takip', 'kod', 'bv', 'sorgula', 'durum', 'başvuru'],
    requiresAuth: false,
    featured: true,
    quick: true,
    icon: 'track',
  },
  {
    id: 'belge',
    title: 'Belge başvurusu',
    blurb: 'İkametgâh, borç yoktur ve imar belgesi talebi (demo).',
    to: '/basvurular',
    category: 'Başvuru & belgeler',
    kind: 'Başvuru',
    keywords: ['belge', 'ikametgah', 'ikametgâh', 'borç yoktur', 'ruhsat', 'başvuru'],
    requiresAuth: true,
    icon: 'doc',
  },
  {
    id: 'nikah',
    title: 'Nikah işlemleri',
    blurb: 'Salon ve saat seçerek kurgusal nikah randevusu alın.',
    to: '/nikah',
    category: 'Nikah & aile',
    kind: 'Randevu',
    keywords: ['nikah', 'düğün', 'salon', 'evlilik', 'randevu', 'aile'],
    requiresAuth: false,
    featured: true,
    quick: true,
    icon: 'ring',
  },
  {
    id: 'imar',
    title: 'İmar durumu',
    blurb: 'Ada ve parsel ile imar kaydı ve harç hesabı (demo parsel).',
    to: '/imar',
    category: 'İmar & şehircilik',
    kind: 'Sorgulama',
    keywords: ['imar', 'ada', 'parsel', 'harç', 'şehircilik', 'arsa'],
    requiresAuth: false,
    featured: true,
    quick: true,
    icon: 'plot',
  },
  {
    id: 'spor',
    title: 'Spor randevusu',
    blurb: 'Salon, halı saha ve havuz için saatlik randevu.',
    to: '/spor-randevu',
    category: 'Spor & tesisler',
    kind: 'Randevu',
    keywords: ['spor', 'randevu', 'saha', 'havuz', 'tesis', 'salon'],
    requiresAuth: false,
    featured: true,
    quick: true,
    icon: 'sport',
  },
  {
    id: 'talepler',
    title: 'Talep ve öneri',
    blurb: 'Şikâyet, öneri ve talep kaydı açın; durumunu panelden izleyin.',
    to: '/talepler',
    category: 'Sosyal hizmetler',
    kind: 'Başvuru',
    keywords: ['talep', 'öneri', 'şikayet', 'şikâyet', 'destek'],
    requiresAuth: true,
    icon: 'desk',
  },
  {
    id: 'yardim',
    title: 'Sosyal yardım',
    blurb: 'Sosyal destek başvurusu için vatandaş işlem alanı.',
    to: '/yardim',
    category: 'Sosyal hizmetler',
    kind: 'Başvuru',
    keywords: ['sosyal', 'yardım', 'destek', 'ihtiyaç'],
    requiresAuth: true,
    icon: 'aid',
  },
  {
    id: 'ulasim-agi',
    title: 'Ulaşım ağı',
    blurb: 'Hat tablosu, kart ve biniş işlemlerinin ortak girişi.',
    to: '/ulasim-agi',
    category: 'Ulaşım',
    kind: 'Sorgulama',
    keywords: ['ulaşım', 'hat', 'otobüs', 'kart', 'biniş'],
    requiresAuth: false,
    icon: 'bus',
  },
  {
    id: 'hatlar',
    title: 'Otobüs hatları',
    blurb: 'Güzergâh, durak ve hareket saatleri.',
    to: '/hatlar',
    category: 'Ulaşım',
    kind: 'Sorgulama',
    keywords: ['hat', 'otobüs', 'durak', 'saat', 'ulaşım'],
    requiresAuth: false,
    icon: 'bus',
  },
  {
    id: 'ulasim-kart',
    title: 'Ulaşım kartı',
    blurb: 'Kart bakiyesi ve işlemleri (giriş gerekir).',
    to: '/ulasim',
    category: 'Ulaşım',
    kind: 'Sorgulama',
    keywords: ['kart', 'bakiye', 'ulaşım', 'yükle'],
    requiresAuth: true,
    icon: 'pay',
  },
  {
    id: 'rehber',
    title: 'Hizmet rehberi',
    blurb: 'Hangi işleme gideceğinizi bilmiyorsanız kısa yol listesi.',
    to: '/hizmet-rehberi',
    category: 'Rehber & destek',
    kind: 'Destek',
    keywords: ['rehber', 'hizmet', 'yardım', 'nasıl'],
    requiresAuth: false,
    icon: 'guide',
  },
  {
    id: 'iletisim',
    title: 'İletişim',
    blurb: 'Yazışma formu ve demo çağrı hattı.',
    to: '/iletisim',
    category: 'Rehber & destek',
    kind: 'Destek',
    keywords: ['iletişim', 'telefon', 'mesaj', 'çağrı', 'destek'],
    requiresAuth: false,
    icon: 'help',
  },
]

export function searchServices(query: string): DigitalService[] {
  const needle = query.trim().toLocaleLowerCase('tr-TR')
  if (!needle) return DIGITAL_SERVICES
  return DIGITAL_SERVICES.filter((item) => {
    const hay = [item.title, item.blurb, item.category, item.kind, ...item.keywords]
      .join(' ')
      .toLocaleLowerCase('tr-TR')
    return hay.includes(needle)
  })
}

export function servicesInCategory(category: string): DigitalService[] {
  if (category === 'Tümü') return DIGITAL_SERVICES
  return DIGITAL_SERVICES.filter((item) => item.category === category)
}

export function featuredServices(): { lead: DigitalService; rest: DigitalService[] } {
  const lead = DIGITAL_SERVICES.find((item) => item.id === 'vezne') ?? DIGITAL_SERVICES[0]
  const rest = DIGITAL_SERVICES.filter((item) => item.featured && item.id !== lead.id).slice(0, 4)
  return { lead, rest }
}

export function quickServices(): DigitalService[] {
  return DIGITAL_SERVICES.filter((item) => item.quick)
}

export function presentCategories(): string[] {
  const seen = new Set(DIGITAL_SERVICES.map((item) => item.category))
  return ['Tümü', ...SERVICE_CATEGORIES.filter((label) => seen.has(label))]
}
