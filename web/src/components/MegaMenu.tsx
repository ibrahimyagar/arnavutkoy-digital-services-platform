import { Link, NavLink } from 'react-router-dom'
import {
  CITIZEN_MODULES,
  PUBLIC_MODULES,
  STAFF_MODULES,
  ADMIN_MODULES,
  type ModuleTile,
  type NavSection,
} from '../lib/modules'

export type MegaColumn = {
  id: string
  title: string
  items: ModuleTile[]
}

export type MegaShortcut = {
  id: string
  title: string
  to: string
  icon: MegaIconName
}

export type MegaIconName =
  | 'ebld'
  | 'request'
  | 'news'
  | 'events'
  | 'announce'
  | 'contact'
  | 'panel'
  | 'cash'

type MegaArgs = {
  isAuthenticated: boolean
  isCitizen: boolean
  isStaff: boolean
  isAdmin: boolean
  sections: NavSection[]
}

function byIds(pool: ModuleTile[], ids: string[]): ModuleTile[] {
  return ids
    .map((id) => pool.find((m) => m.id === id))
    .filter((m): m is ModuleTile => Boolean(m))
}

/** Karşıyaka tarzı sütun + kısayol düzeni (navy/teal palet için veri). */
export function getMegaMenuLayout(args: MegaArgs): {
  categories: { id: string; title: string }[]
  columns: MegaColumn[]
  shortcuts: MegaShortcut[]
} {
  if (args.isAuthenticated && args.isStaff) {
    const columns: MegaColumn[] = args.sections.map((s) => ({
      id: s.id,
      title: s.title,
      items: s.items,
    }))
    const shortcuts: MegaShortcut[] = byIds(STAFF_MODULES, [
      'staff-panel',
      'staff-desk',
      'staff-announcements',
      'staff-requests',
    ])
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        title: m.title.toLocaleUpperCase('tr-TR'),
        to: m.to,
        icon:
          m.id === 'staff-panel'
            ? 'panel'
            : m.id === 'staff-desk' || m.id === 'staff-requests'
              ? 'request'
              : 'announce',
      }))
    if (args.isAdmin) {
      const admin = byIds(ADMIN_MODULES, ['admin-geo', 'admin-hr']).map((m) => ({
        id: m.id,
        title: m.title.toLocaleUpperCase('tr-TR'),
        to: m.to,
        icon: 'panel' as const,
      }))
      shortcuts.push(...admin)
    }
    return {
      categories: columns.map((c) => ({ id: c.id, title: c.title })),
      columns,
      shortcuts: shortcuts.slice(0, 6),
    }
  }

  const columns: MegaColumn[] = [
    {
      id: 'kurumsal',
      title: 'Kurumsal',
      items: byIds(PUBLIC_MODULES, ['mayor', 'corporate', 'departments', 'headmens']),
    },
    {
      id: 'bilgi',
      title: 'Bilgi hizmetleri',
      items: byIds(PUBLIC_MODULES, ['news', 'announcements', 'events', 'projects', 'culture']),
    },
    {
      id: 'hizmet',
      title: 'Hizmetlerimiz',
      items: byIds(PUBLIC_MODULES, [
        'e-belediye',
        'service-guide',
        'bus-lines',
        'transport-network',
        'contact',
      ]),
    },
  ]

  if (args.isAuthenticated && args.isCitizen) {
    columns.push({
      id: 'services',
      title: 'Hizmetlerim',
      items: byIds(CITIZEN_MODULES, [
        'panel',
        'cash-desk-member',
        'debts',
        'requests',
        'docs-apply',
        'settings',
      ]),
    })
  }

  const shortcuts: MegaShortcut[] = [
    { id: 'e-belediye', title: 'E-BELEDİYE', to: '/e-belediye', icon: 'ebld' },
    { id: 'request', title: 'ŞİKAYET / TALEP', to: '/iletisim', icon: 'request' },
    { id: 'news', title: 'HABERLER', to: '/haberler', icon: 'news' },
    { id: 'events', title: 'ETKİNLİKLER', to: '/etkinlikler', icon: 'events' },
    { id: 'announce', title: 'DUYURULAR', to: '/duyurular', icon: 'announce' },
    { id: 'contact', title: 'İLETİŞİM', to: '/iletisim', icon: 'contact' },
  ]

  return {
    categories: [
      ...columns.map((c) => ({ id: c.id, title: c.title })),
      { id: 'iletisim', title: 'İletişim' },
    ],
    columns,
    shortcuts,
  }
}

function MegaIcon({ name }: { name: MegaIconName }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'ebld':
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path d="M8 9h8M8 12.5h8M8 16h5" />
        </svg>
      )
    case 'request':
      return (
        <svg {...common}>
          <path d="M5 5.5h14v11H9l-4 3v-3H5z" />
          <path d="M9 10h6M9 13h4" />
        </svg>
      )
    case 'news':
      return (
        <svg {...common}>
          <path d="M5 5.5h11.5A2.5 2.5 0 0 1 19 8v11H7.5A2.5 2.5 0 0 1 5 16.5z" />
          <path d="M8.5 9.5h7M8.5 13h5" />
        </svg>
      )
    case 'events':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3.5V7M16 3.5V7M3.5 10h17" />
        </svg>
      )
    case 'announce':
      return (
        <svg {...common}>
          <path d="M3 11v2a1 1 0 0 0 1 1h2l6 4V6L6 10H4a1 1 0 0 0-1 1Z" />
          <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
        </svg>
      )
    case 'contact':
      return (
        <svg {...common}>
          <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19h-9A2.5 2.5 0 0 1 5 16.5z" />
          <path d="M8.5 10.5h7M8.5 14h4.5" />
        </svg>
      )
    case 'panel':
      return (
        <svg {...common}>
          <rect x="3.5" y="4" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="4" width="7" height="7" rx="1.2" />
          <rect x="3.5" y="13" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="13" width="7" height="7" rx="1.2" />
        </svg>
      )
    case 'cash':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.4" />
        </svg>
      )
  }
}

type MegaMenuProps = {
  open: boolean
  menuId: string
  columns: MegaColumn[]
  shortcuts: MegaShortcut[]
  onClose: () => void
}

export function MegaMenu({ open, menuId, columns, shortcuts, onClose }: MegaMenuProps) {
  return (
    <div
      id={menuId}
      className={`mega${open ? ' is-open' : ''}`}
      aria-hidden={!open}
      aria-label="Site menüsü"
    >
      <div className="mega-inner">
        <div className="mega-cols">
          {columns.map((column, columnIndex) => (
            <section
              key={column.id}
              id={`mega-col-${column.id}`}
              className="mega-col"
              style={{ animationDelay: `${60 + columnIndex * 45}ms` }}
            >
              <h3>{column.title}</h3>
              <ul>
                {column.items.map((item) => (
                  <li key={item.id}>
                    <NavLink to={item.to} end={item.to === '/'} onClick={onClose}>
                      {item.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mega-shortcuts" style={{ animationDelay: '140ms' }}>
          {shortcuts.map((item) => (
            <Link key={item.id} to={item.to} className="mega-tile" onClick={onClose}>
              <span className="mega-tile-icon" aria-hidden>
                <MegaIcon name={item.icon} />
              </span>
              <span className="mega-tile-label">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
