export type ModuleVisual =
  | 'news'
  | 'transit'
  | 'village'
  | 'office'
  | 'cash'
  | 'debt'
  | 'desk'
  | 'card'
  | 'board'
  | 'home'
  | 'water'
  | 'aid'
  | 'panel'
  | 'settings'
  | 'default'

export type ModuleTile = {
  id: string
  title: string
  description: string
  to: string
  requiresAuth: boolean
  audience: 'public' | 'citizen' | 'staff' | 'admin'
  visual?: ModuleVisual
}

const VISUAL_BY_ID: Record<string, ModuleVisual> = {
  announcements: 'news',
  'bus-lines': 'transit',
  headmens: 'village',
  departments: 'office',
  'cash-desk': 'cash',
  'cash-desk-member': 'cash',
  debts: 'debt',
  requests: 'desk',
  transport: 'card',
  simulator: 'board',
  properties: 'home',
  water: 'water',
  social: 'aid',
  panel: 'panel',
  settings: 'settings',
}

export function moduleVisual(mod: ModuleTile): ModuleVisual {
  return mod.visual ?? VISUAL_BY_ID[mod.id] ?? 'default'
}

export type NavSection = {
  id: string
  title: string
  items: ModuleTile[]
}

/** Belediye portal menü kataloğu — mevcut API yüzeyine bağlı. */
export const PUBLIC_MODULES: ModuleTile[] = [
  {
    id: 'e-belediye',
    title: 'E-Belediye',
    visual: 'cash',
    description: 'Vergi, nikah, imar, spor, başvuru hub',
    to: '/e-belediye',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'news',
    title: 'Haberler',
    visual: 'news',
    description: 'Güncel haberler',
    to: '/haberler',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'announcements',
    title: 'Duyurular',
    visual: 'news',
    description: 'Yayımlanan belediye duyuruları',
    to: '/duyurular',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'events',
    title: 'Etkinlikler',
    visual: 'news',
    description: 'Kültür ve spor takvimi',
    to: '/etkinlikler',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'projects',
    title: 'Faaliyetler',
    visual: 'office',
    description: 'Proje ve yatırımlar',
    to: '/faaliyetler',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'culture',
    title: 'Kültür & sanat',
    visual: 'office',
    description: 'Tesis ve mekânlar',
    to: '/kultur',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'service-guide',
    title: 'Hizmet rehberi',
    visual: 'desk',
    description: 'Sık kullanılan işlemler',
    to: '/hizmet-rehberi',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'mayor',
    title: 'Başkan',
    visual: 'office',
    description: 'Başkanlık mesajı ve vizyon',
    to: '/baskan',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'corporate',
    title: 'Kurumsal',
    visual: 'office',
    description: 'Belediyeyi tanı, yapıyı keşfet',
    to: '/kurumsal',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'contact',
    title: 'Bize ulaşın',
    visual: 'desk',
    description: 'İletişim formu',
    to: '/iletisim',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'bus-lines',
    title: 'Ulaşım hatları',
    description: 'Hat, durak ve hareket saatleri',
    to: '/hatlar',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'transport-network',
    title: 'Ulaşım ağı',
    visual: 'transit',
    description: 'Hat tablosu, kart ve biniş hub',
    to: '/ulasim-agi',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'headmens',
    title: 'Muhtarlıklar',
    description: 'Mahalle mahalle keşif ve muhtar hattı',
    to: '/muhtarliklar',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'departments',
    title: 'Birimler',
    visual: 'office',
    description: 'Departman ve personel dizini',
    to: '/birimler',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'cash-desk',
    title: 'Dijital vezne',
    visual: 'cash',
    description: 'Borç ödeme ve kart bakiye yükleme',
    to: '/vezne',
    requiresAuth: true,
    audience: 'citizen',
  },
]

export const CITIZEN_MODULES: ModuleTile[] = [
  {
    id: 'cash-desk-member',
    title: 'Dijital vezne',
    visual: 'cash',
    description: 'Borç ödeme ve kart bakiye yükleme',
    to: '/vezne',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'docs-apply',
    title: 'Belge başvuruları',
    visual: 'desk',
    description: 'İkametgâh / borç yoktur',
    to: '/basvurular',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'tracking',
    title: 'Başvuru takibi',
    visual: 'desk',
    description: 'Takip kodu sorgula',
    to: '/basvuru-takip',
    requiresAuth: false,
    audience: 'citizen',
  },
  {
    id: 'marriage',
    title: 'Nikah randevu',
    visual: 'desk',
    description: 'Salon ve saat seç',
    to: '/nikah',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'zoning',
    title: 'İmar & harç',
    visual: 'home',
    description: 'Ada/parsel sorgu',
    to: '/imar',
    requiresAuth: false,
    audience: 'citizen',
  },
  {
    id: 'sports',
    title: 'Spor randevu',
    visual: 'board',
    description: 'Tesis rezervasyonu',
    to: '/spor-randevu',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'my-events',
    title: 'Etkinlik kayıtlarım',
    visual: 'news',
    description: 'Katıldığınız program',
    to: '/etkinliklerim',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'debts',
    title: 'Borçlarım',
    description: 'Su / emlak borcu ve gecikme faizi',
    to: '/borclar',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'requests',
    title: 'Hizmet masası',
    description: 'Talep oluştur, yazış, takip et',
    to: '/talepler',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'transport',
    title: 'Ulaşım kartı',
    description: 'Kart, bakiye ve biniş',
    to: '/ulasim',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'simulator',
    title: 'Biniş simülasyonu',
    description: 'Hat seç → kart seç → bin',
    to: '/binis',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'properties',
    title: 'Mülklerim',
    description: 'Mahalle / sokak bazlı kayıt',
    to: '/mulkler',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'water',
    title: 'Su aboneliği',
    description: 'Abone no ve durum',
    to: '/su',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'social',
    title: 'Sosyal yardım',
    description: 'Başvuru ve durum takibi',
    to: '/yardim',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'panel',
    title: 'Panel',
    visual: 'panel',
    description: 'Kişisel hizmet özeti',
    to: '/panel',
    requiresAuth: true,
    audience: 'citizen',
  },
  {
    id: 'settings',
    title: 'Hesap ayarları',
    description: 'Profil, telefon ve parola',
    to: '/ayarlar',
    requiresAuth: true,
    audience: 'citizen',
  },
]

export const STAFF_MODULES: ModuleTile[] = [
  {
    id: 'staff-desk',
    title: 'Personel masası',
    description: 'Talep ve sosyal yardım değerlendirme',
    to: '/personel',
    requiresAuth: true,
    audience: 'staff',
  },
  {
    id: 'staff-water',
    title: 'Su yönetimi',
    description: 'Abonelik ve borç kesme',
    to: '/su-yonetimi',
    requiresAuth: true,
    audience: 'staff',
  },
  {
    id: 'staff-property',
    title: 'Mülk yönetimi',
    description: 'Emlak vergisi borcu',
    to: '/mulk-yonetimi',
    requiresAuth: true,
    audience: 'staff',
  },
  {
    id: 'staff-announcements',
    title: 'Duyuru yönetimi',
    description: 'Taslak, yayın ve arşiv',
    to: '/duyuru-yonetimi',
    requiresAuth: true,
    audience: 'staff',
  },
  {
    id: 'staff-requests',
    title: 'Talepler',
    description: 'Hizmet talepleri',
    to: '/talepler',
    requiresAuth: true,
    audience: 'staff',
  },
  {
    id: 'staff-panel',
    title: 'Panel',
    description: 'Operasyon özeti',
    to: '/panel',
    requiresAuth: true,
    audience: 'staff',
  },
  {
    id: 'staff-settings',
    title: 'Hesap ayarları',
    description: 'Profil, telefon ve parola',
    to: '/ayarlar',
    requiresAuth: true,
    audience: 'staff',
  },
]

export const ADMIN_MODULES: ModuleTile[] = [
  {
    id: 'admin-geo',
    title: 'Coğrafya',
    description: 'İlçe, mahalle, sokak',
    to: '/cografya',
    requiresAuth: true,
    audience: 'admin',
  },
  {
    id: 'admin-lines',
    title: 'Hat yönetimi',
    description: 'Hat, durak, saat',
    to: '/hat-yonetimi',
    requiresAuth: true,
    audience: 'admin',
  },
  {
    id: 'admin-hr',
    title: 'Birim yönetimi',
    description: 'Departman ve personel',
    to: '/birim-yonetimi',
    requiresAuth: true,
    audience: 'admin',
  },
]

const HOME_ITEM: ModuleTile = {
  id: 'home',
  title: 'Ana sayfa',
  description: 'Belediye ana sayfası',
  to: '/',
  requiresAuth: false,
  audience: 'public',
}

type SidebarArgs = {
  isAuthenticated: boolean
  isCitizen: boolean
  isStaff: boolean
  isAdmin: boolean
}

/** Sidebar: misafir kurumsal menü; vatandaşta + Hizmetlerim; personelde operasyon. */
export function getSidebarSections({
  isAuthenticated,
  isCitizen,
  isStaff,
  isAdmin,
}: SidebarArgs): NavSection[] {
  const byId = (pool: ModuleTile[], ids: string[]) =>
    ids
      .map((id) => pool.find((m) => m.id === id))
      .filter((m): m is ModuleTile => Boolean(m))

  if (isAuthenticated && isStaff) {
    const sections: NavSection[] = [
      {
        id: 'ops',
        title: 'Operasyon',
        items: byId(STAFF_MODULES, [
          'staff-panel',
          'staff-desk',
          'staff-requests',
          'staff-announcements',
          'staff-water',
          'staff-property',
        ]),
      },
    ]
    if (isAdmin) {
      sections.push({
        id: 'admin',
        title: 'Yönetim',
        items: ADMIN_MODULES,
      })
    }
    sections.push({
      id: 'account',
      title: 'Hesap',
      items: byId(STAFF_MODULES, ['staff-settings']),
    })
    return sections
  }

  const municipalNav = [
    HOME_ITEM,
    ...byId(PUBLIC_MODULES, [
      'e-belediye',
      'announcements',
      'news',
      'events',
      'headmens',
      'departments',
      'contact',
    ]),
  ]

  if (isAuthenticated && isCitizen) {
    return [
      {
        id: 'municipal',
        title: 'Belediye',
        items: municipalNav,
      },
      {
        id: 'services',
        title: 'Hizmetlerim',
        items: byId(CITIZEN_MODULES, [
          'panel',
          'cash-desk-member',
          'debts',
          'requests',
          'my-events',
          'docs-apply',
        ]),
      },
      {
        id: 'account',
        title: 'Hesap',
        items: byId(CITIZEN_MODULES, ['settings']),
      },
    ]
  }

  // Misafir: kurumsal menü (Kayıt/Giriş header'da)
  return [
    {
      id: 'municipal',
      title: 'Menü',
      items: municipalNav,
    },
  ]
}

