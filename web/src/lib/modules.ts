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

/** Referans e-belediye menü zenginliğine yakın, mevcut API yüzeyine bağlı modül kataloğu. */
export const PUBLIC_MODULES: ModuleTile[] = [
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
    description: 'Mahalle, nüfus ve muhtar iletişimi',
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
  description: 'Modül kataloğu',
  to: '/',
  requiresAuth: false,
  audience: 'public',
}

const AUTH_ITEMS: ModuleTile[] = [
  {
    id: 'login',
    title: 'Giriş yap',
    description: 'Hesabınıza giriş',
    to: '/giris',
    requiresAuth: false,
    audience: 'public',
  },
  {
    id: 'register',
    title: 'Kayıt ol',
    description: 'Vatandaş hesabı oluştur',
    to: '/kayit',
    requiresAuth: false,
    audience: 'public',
  },
]

type SidebarArgs = {
  isAuthenticated: boolean
  isCitizen: boolean
  isStaff: boolean
  isAdmin: boolean
}

/** Referans sidebar.php yapısı: üyeliksiz → özel / personel / yönetim → üyelik. */
export function getSidebarSections({
  isAuthenticated,
  isCitizen,
  isStaff,
  isAdmin,
}: SidebarArgs): NavSection[] {
  const sections: NavSection[] = [
    {
      id: 'public',
      title: 'Üyeliksiz işlemler',
      items: [HOME_ITEM, ...PUBLIC_MODULES.filter((m) => !m.requiresAuth)],
    },
  ]

  if (isAuthenticated && isCitizen) {
    sections.push({
      id: 'citizen',
      title: 'Özel işlemler',
      items: CITIZEN_MODULES,
    })
  }

  if (isAuthenticated && isStaff) {
    sections.push({
      id: 'staff',
      title: 'Personel',
      items: STAFF_MODULES,
    })
  }

  if (isAuthenticated && isAdmin) {
    sections.push({
      id: 'admin',
      title: 'Yönetim',
      items: ADMIN_MODULES,
    })
  }

  if (!isAuthenticated) {
    sections.push({
      id: 'membership',
      title: 'Üyelik',
      items: AUTH_ITEMS,
    })
  }

  return sections
}

